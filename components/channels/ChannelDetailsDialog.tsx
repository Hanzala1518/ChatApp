"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabaseClient";
import { useAppStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";
import { 
  X, 
  Copy, 
  Check, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Pencil,
  Loader2,
  Users,
  Key
} from "lucide-react";
import { toast } from "sonner";
import type { Channel, Profile } from "@/lib/types";

interface ChannelMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: Profile;
}

interface ChannelDetailsDialogProps {
  channel: Channel & { invite_code?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function ChannelDetailsDialog({ 
  channel, 
  open, 
  onOpenChange, 
  currentUserId 
}: ChannelDetailsDialogProps) {
  const [members, setMembers] = useState<ChannelMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(channel.name);
  const [savingName, setSavingName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState(channel.invite_code || "");
  const { onlineUsers } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadMembers();
      loadInviteCode();
    }
  }, [open, channel.id]);

  async function loadMembers() {
    setLoading(true);
    try {
      // Get all members
      const { data: memberData, error } = await supabase
        .from("channel_members")
        .select("id, user_id, role, joined_at")
        .eq("channel_id", channel.id);

      if (error) throw error;

      // Fetch profiles for all members
      const userIds = (memberData || []).map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const membersWithProfiles = (memberData || []).map((m: any) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      }));

      setMembers(membersWithProfiles);

      // Check if current user is admin
      const currentMember = membersWithProfiles.find(m => m.user_id === currentUserId);
      setIsAdmin(currentMember?.role === "admin" || channel.created_by === currentUserId);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInviteCode() {
    if (!channel.is_private) return;
    
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("invite_code")
        .eq("id", channel.id)
        .single();

      if (!error && data) {
        setInviteCode((data as any).invite_code || "");
      }
    } catch (error) {
      console.error("Error loading invite code:", error);
    }
  }

  async function generateInviteCode() {
    try {
      // Generate a random 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data, error, count } = await supabase
        .from("channels")
        // @ts-ignore - Supabase type inference issue
        .update({ invite_code: code })
        .eq("id", channel.id)
        .select("invite_code");

      if (error) {
        console.error("Invite code generation error:", error);
        if (error.message?.includes("invite_code") || error.code === "42703") {
          toast.error("Please run NEW-FEATURES-DB.sql in Supabase first");
        } else if (error.code === "42501" || error.message?.includes("policy")) {
          toast.error("You don't have permission to generate invite codes");
        } else {
          toast.error("Failed to generate invite code: " + (error.message || "Unknown error"));
        }
        return;
      }

      // Check if the update actually affected any rows
      if (!data || data.length === 0) {
        console.error("No rows updated - likely RLS policy issue");
        toast.error("You don't have permission to generate invite codes. Only the channel creator or admin can do this.");
        return;
      }
      
      setInviteCode(code);
      toast.success("Invite code generated!");
    } catch (error: any) {
      console.error("Error generating invite code:", error);
      toast.error("Failed to generate invite code: " + (error?.message || "Unknown error"));
    }
  }

  async function copyInviteCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateChannelName() {
    if (!newName.trim() || newName === channel.name) {
      setIsEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const { error } = await supabase
        .from("channels")
        // @ts-ignore - Supabase type inference issue
        .update({ name: newName.trim() })
        .eq("id", channel.id);

      if (error) throw error;
      
      toast.success("Channel name updated");
      setIsEditingName(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating channel name:", error);
      toast.error("Failed to update channel name");
    } finally {
      setSavingName(false);
    }
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (memberUserId === currentUserId) {
      toast.error("You cannot remove yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from("channel_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success("Member removed");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  }

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            {isEditingName && isAdmin ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  onClick={updateChannelName}
                  disabled={savingName}
                >
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(channel.name);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span>{channel.name}</span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {channel.is_private ? "Private Channel" : "Public Channel"} • {members.length} members
          </DialogDescription>
        </DialogHeader>

        {/* Invite Code Section - Only for private channels and admins */}
        {channel.is_private && isAdmin && (
          <div className="space-y-2 pb-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4" />
              Invite Code
            </Label>
            <div className="flex items-center gap-2">
              {inviteCode ? (
                <>
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                    {inviteCode}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyInviteCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={generateInviteCode}>
                  Generate Invite Code
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with others to let them join
            </p>
          </div>
        )}

        <Separator />

        {/* Members Section */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between py-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </Label>
          </div>
          
          <ScrollArea className="h-[250px] pr-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profile?.display_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                            isOnline(member.user_id) ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {member.profile?.display_name || "Unknown"}
                          </span>
                          {(member.role === "admin" || member.user_id === channel.created_by) && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          @{member.profile?.username || "unknown"}
                        </span>
                      </div>
                    </div>
                    
                    {isAdmin && member.user_id !== currentUserId && member.user_id !== channel.created_by && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeMember(member.id, member.user_id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

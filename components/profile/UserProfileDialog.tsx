"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabaseClient";
import { useAppStore } from "@/lib/store";
import { getInitials, formatTimestamp } from "@/lib/utils";
import { MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ userId, open, onOpenChange }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { onlineUsers } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const isOnline = userId ? onlineUsers.has(userId) : false;

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  async function loadProfile() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startDM() {
    if (!userId || !profile) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Normalize user IDs (smaller ID first)
      const [userA, userB] = [user.id, userId].sort();

      // Check if conversation already exists
      const { data: existingList } = await supabase
        .from("direct_conversations")
        .select("id")
        .eq("user_a_id", userA)
        .eq("user_b_id", userB)
        .limit(1);

      const existing = existingList && existingList.length > 0 ? existingList[0] : null;
      let conversationId: string;

      if (existing) {
        conversationId = (existing as any).id;
      } else {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from("direct_conversations")
          // @ts-ignore
          .insert({
            user_a_id: userA,
            user_b_id: userB,
          })
          .select("id")
          .single();

        if (error || !newConvo) throw error || new Error("Failed to create conversation");
        conversationId = (newConvo as any).id;
      }

      onOpenChange(false);
      router.push(`/dms/${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  }

  if (!profile && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-background ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold">{profile.display_name}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {profile.status_message && (
              <p className="text-sm text-muted-foreground italic text-center px-4">
                &ldquo;{profile.status_message}&rdquo;
              </p>
            )}

            {!isOnline && profile.last_seen_at && (
              <p className="text-xs text-muted-foreground">
                Last seen: {formatTimestamp(profile.last_seen_at)}
              </p>
            )}

            <Button onClick={startDM} className="mt-4" variant="gradient">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

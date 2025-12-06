"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabaseClient";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ChannelWithMembership } from "@/lib/types";

interface JoinPrivateChannelDialogProps {
  channel: ChannelWithMembership;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined?: () => void;
}

export function JoinPrivateChannelDialog({
  channel,
  open,
  onOpenChange,
  onJoined,
}: JoinPrivateChannelDialogProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleJoin() {
    if (!inviteCode.trim()) {
      toast.error("Please enter the invite code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Verify the invite code matches
      const { data: channelData, error: fetchError } = await supabase
        .from("channels")
        .select("invite_code")
        .eq("id", channel.id)
        .single();

      if (fetchError) throw fetchError;

      const channelInviteCode = (channelData as any)?.invite_code;

      if (!channelInviteCode) {
        toast.error("This channel doesn't have an invite code yet. Ask the admin to generate one.");
        return;
      }

      if (channelInviteCode.toUpperCase() !== inviteCode.trim().toUpperCase()) {
        toast.error("Invalid invite code");
        return;
      }

      // Join the channel
      const { error: joinError } = await supabase
        .from("channel_members")
        // @ts-ignore
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role: "member",
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.info("You're already a member of this channel");
        } else {
          throw joinError;
        }
      } else {
        toast.success(`Joined ${channel.name}!`);
      }

      onOpenChange(false);
      setInviteCode("");
      onJoined?.();
      router.push(`/channels/${channel.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error joining channel:", error);
      toast.error("Failed to join channel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Join Private Channel
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">#{channel.name}</span> is a private channel. 
            Enter the invite code to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-widest"
              maxLength={8}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <p className="text-xs text-muted-foreground">
              Ask a channel admin for the invite code
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={loading || !inviteCode.trim()}
              className="flex-1"
              variant="gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Channel"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

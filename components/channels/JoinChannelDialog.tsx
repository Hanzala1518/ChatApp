"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabaseClient";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function JoinChannelDialog() {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleJoin() {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Find channel by invite code
      const { data: channels, error: findError } = await supabase
        .from("channels")
        .select("id, name")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .limit(1);

      if (findError) throw findError;

      if (!channels || channels.length === 0) {
        toast.error("Invalid invite code");
        return;
      }

      const channel = channels[0] as any;

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("channel_members")
        .select("id")
        .eq("channel_id", channel.id)
        .eq("user_id", user.id)
        .limit(1);

      if (existingMember && existingMember.length > 0) {
        toast.info("You're already a member of this channel");
        setOpen(false);
        router.push(`/channels/${channel.id}`);
        return;
      }

      // Join the channel
      const { error: joinError } = await supabase
        .from("channel_members")
        // @ts-ignore - Supabase type inference issue
        .insert({
          channel_id: channel.id,
          user_id: user.id,
          role: "member",
        });

      if (joinError) throw joinError;

      toast.success(`Joined ${channel.name}!`);
      setOpen(false);
      setInviteCode("");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <KeyRound className="h-4 w-4" />
          Join with Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Channel</DialogTitle>
          <DialogDescription>
            Enter an invite code to join a private channel
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
              className="font-mono"
              maxLength={8}
            />
          </div>
          <Button
            onClick={handleJoin}
            disabled={loading || !inviteCode.trim()}
            className="w-full"
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
      </DialogContent>
    </Dialog>
  );
}

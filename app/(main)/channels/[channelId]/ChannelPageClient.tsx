"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ChannelHeader } from "@/components/channels/ChannelHeader";
import { ChannelDetailsDialog } from "@/components/channels/ChannelDetailsDialog";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import type { Channel, MessageWithAuthor } from "@/lib/types";
import { toast } from "sonner";

interface ChannelPageClientProps {
  channel: Channel & { invite_code?: string };
  memberCount: number;
  messages: MessageWithAuthor[];
  currentUserId: string;
}

export function ChannelPageClient({
  channel,
  memberCount,
  messages,
  currentUserId,
}: ChannelPageClientProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Monitor membership changes - redirect if removed
  useEffect(() => {
    let isActive = true;

    // Check membership periodically (fallback in case realtime fails)
    const checkMembership = async () => {
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channel.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (!isActive) return;

      if (!membership) {
        setIsMember(false);
        toast.error('You have been removed from this channel');
        // Small delay to show the toast
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 500);
      }
    };

    // Check immediately on mount
    checkMembership();

    // Real-time subscription for immediate response
    const membershipChannel = supabase
      .channel(`membership:${channel.id}:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'channel_members',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          // Check if it's for this channel
          if ((payload.old as any).channel_id === channel.id) {
            setIsMember(false);
            toast.error('You have been removed from this channel');
            // Small delay to show the toast
            setTimeout(() => {
              router.push('/');
              router.refresh();
            }, 500);
          }
        }
      )
      .subscribe();

    // Check membership every 3 seconds as fallback
    const interval = setInterval(checkMembership, 3000);

    return () => {
      isActive = false;
      clearInterval(interval);
      supabase.removeChannel(membershipChannel);
    };
  }, [channel.id, currentUserId, router, supabase]);

  return (
    <div className="flex flex-col h-full">
      <ChannelHeader
        channel={channel}
        memberCount={memberCount}
        onInfoClick={() => setShowDetails(true)}
      />
      <MessageList
        channelId={channel.id}
        currentUserId={currentUserId}
        initialMessages={messages}
      />
      {isMember ? (
        <MessageInput channelId={channel.id} />
      ) : (
        <div className="p-4 border-t bg-muted/50 text-center text-sm text-muted-foreground">
          You are no longer a member of this channel
        </div>
      )}
      
      <ChannelDetailsDialog
        channel={channel}
        open={showDetails}
        onOpenChange={setShowDetails}
        currentUserId={currentUserId}
      />
    </div>
  );
}

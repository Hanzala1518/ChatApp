'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  channelId?: string;
  conversationId?: string;
  isDM?: boolean;
  currentUserId: string;
  initialReactions?: Array<{ emoji: string; user_id: string }>;
}

export function MessageReactions({
  messageId,
  channelId,
  conversationId,
  isDM = false,
  currentUserId,
  initialReactions = [],
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const supabase = createClient();

  // Process initial reactions into grouped format
  useEffect(() => {
    const grouped = new Map<string, { count: number; userReacted: boolean }>();
    
    initialReactions.forEach((r) => {
      const existing = grouped.get(r.emoji) || { count: 0, userReacted: false };
      grouped.set(r.emoji, {
        count: existing.count + 1,
        userReacted: existing.userReacted || r.user_id === currentUserId,
      });
    });

    setReactions(
      Array.from(grouped.entries()).map(([emoji, data]) => ({
        emoji,
        ...data,
      }))
    );
  }, [initialReactions, currentUserId]);

  // Subscribe to reaction changes
  useEffect(() => {
    const table = isDM ? 'dm_reactions' : 'message_reactions';
    
    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `message_id=eq.${messageId}`,
        },
        async () => {
          // Refetch reactions when changes occur
          const { data } = await supabase
            .from(table)
            .select('emoji, user_id')
            .eq('message_id', messageId);

          if (data) {
            const grouped = new Map<string, { count: number; userReacted: boolean }>();
            
            data.forEach((r: any) => {
              const existing = grouped.get(r.emoji) || { count: 0, userReacted: false };
              grouped.set(r.emoji, {
                count: existing.count + 1,
                userReacted: existing.userReacted || r.user_id === currentUserId,
              });
            });

            setReactions(
              Array.from(grouped.entries()).map(([emoji, data]) => ({
                emoji,
                ...data,
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messageId, isDM, currentUserId, supabase]);

  const handleReactionClick = async (emoji: string) => {
    try {
      const endpoint = isDM
        ? `/api/dms/${conversationId}/messages/${messageId}/reactions`
        : `/api/channels/${channelId}/messages/${messageId}/reactions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }

      // Optimistic update
      setReactions((prev) => {
        const existing = prev.find((r) => r.emoji === emoji);
        if (existing) {
          if (existing.userReacted) {
            // Remove reaction
            if (existing.count === 1) {
              return prev.filter((r) => r.emoji !== emoji);
            }
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, userReacted: false }
                : r
            );
          } else {
            // Add reaction
            return prev.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userReacted: true }
                : r
            );
          }
        } else {
          // New reaction
          return [...prev, { emoji, count: 1, userReacted: true }];
        }
      });
    } catch (error) {
      toast.error('Failed to update reaction');
    }
  };

  if (reactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
            reaction.userReacted
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-accent/50 hover:bg-accent text-muted-foreground'
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

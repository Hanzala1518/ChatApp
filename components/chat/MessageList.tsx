'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './MessageItem';
import { getDateSeparator } from '@/lib/utils';
import type { MessageWithAuthor } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  channelId?: string;
  conversationId?: string;
  currentUserId: string;
  initialMessages: MessageWithAuthor[];
  isDM?: boolean;
}

export function MessageList({ channelId, conversationId, currentUserId, initialMessages, isDM = false }: MessageListProps) {
  const [messages, setMessages] = useState<MessageWithAuthor[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const shouldScrollRef = useRef(true);
  
  const roomId = isDM ? conversationId : channelId;

  useEffect(() => {
    // Scroll to bottom on initial load
    if (scrollRef.current && shouldScrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    
    // Subscribe to new messages
    const tableName = isDM ? 'direct_messages' : 'messages';
    const filterField = isDM ? 'conversation_id' : 'channel_id';
    
    const channel = supabase
      .channel(`${tableName}:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `${filterField}=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the complete message
          const { data: message } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (message) {
            // Fetch author/sender profile separately
            const userId = isDM ? (message as any).sender_id : (message as any).user_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            const messageWithAuthor = Object.assign({}, message, {
              author: profile,
              sender: profile,
            }) as MessageWithAuthor;

            setMessages((prev) => [...prev, messageWithAuthor]);
            
            // Auto-scroll to bottom if user is near bottom
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
              
              if (isNearBottom) {
                setTimeout(() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                }, 100);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `${filterField}=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, isDM, supabase]);

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageWithAuthor[] }[] = [];
  let currentDate = '';

  messages.forEach((message) => {
    const messageDate = getDateSeparator(message.created_at);
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <ScrollArea className="flex-1">
      <div ref={scrollRef} className="flex flex-col">
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-4">
              <div className="px-4 py-1 rounded-full bg-accent/50 text-xs font-medium">
                {group.date}
              </div>
            </div>
            {group.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.user_id === currentUserId}
                channelId={channelId}
                conversationId={conversationId}
                isDM={isDM}
                currentUserId={currentUserId}
                onEdit={(messageId, newContent) => {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId
                        ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
                        : msg
                    )
                  );
                }}
                onDelete={(messageId) => {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId
                        ? { ...msg, is_deleted: true, content: "" }
                        : msg
                    )
                  );
                }}
              />
            ))}
          </div>
        ))}

        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Be the first to start the conversation!</p>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

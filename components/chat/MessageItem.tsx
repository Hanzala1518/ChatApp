'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageTime, getInitials } from '@/lib/utils';
import { MessageActions } from './MessageActions';
import { EmojiPicker } from './EmojiPicker';
import { MessageReactions } from './MessageReactions';
import { UserProfileDialog } from '@/components/profile/UserProfileDialog';
import type { MessageWithAuthor } from '@/lib/types';
import { toast } from 'sonner';

interface MessageItemProps {
  message: MessageWithAuthor;
  isOwn: boolean;
  channelId?: string;
  conversationId?: string;
  isDM?: boolean;
  currentUserId: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageItem({ 
  message, 
  isOwn, 
  channelId, 
  conversationId, 
  isDM = false,
  currentUserId,
  onEdit = () => {},
  onDelete = () => {},
}: MessageItemProps) {
  const [showProfile, setShowProfile] = useState(false);
  
  // Get the author info - handle both channel messages (author) and DMs (sender)
  const author = message.author || (message as any).sender;
  const authorId = author?.id || message.user_id || (message as any).sender_id;

  const handleEmojiSelect = async (emoji: string) => {
    try {
      const endpoint = isDM
        ? `/api/dms/${conversationId}/messages/${message.id}/reactions`
        : `/api/channels/${channelId}/messages/${message.id}/reactions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  if (message.is_deleted) {
    return (
      <div className="flex gap-3 px-4 py-2 hover:bg-accent/30 transition-smooth">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={author?.avatar_url || undefined} />
          <AvatarFallback>{getInitials(author?.display_name || 'U')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm">{author?.display_name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground italic">Message deleted</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 px-4 py-2 hover:bg-accent/30 transition-smooth group">
        <button 
          onClick={() => !isOwn && authorId && setShowProfile(true)}
          className={`flex-shrink-0 ${!isOwn && authorId ? 'cursor-pointer hover:opacity-80' : ''}`}
          disabled={isOwn || !authorId}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(author?.display_name || 'U')}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <button
              onClick={() => !isOwn && authorId && setShowProfile(true)}
              className={`font-semibold text-sm ${!isOwn && authorId ? 'hover:underline cursor-pointer' : ''}`}
              disabled={isOwn || !authorId}
            >
              {author?.display_name || 'Unknown'}
            </button>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.created_at)}
            </span>
            {message.edited_at && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
            {isOwn && (
              <div className="ml-auto">
                <MessageActions
                  messageId={message.id}
                  content={message.content}
                  channelId={channelId}
                  conversationId={conversationId}
                  isDM={isDM}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          <div className="flex items-center gap-2 mt-1">
            <MessageReactions
              messageId={message.id}
              channelId={channelId}
              conversationId={conversationId}
              isDM={isDM}
              currentUserId={currentUserId}
              initialReactions={message.reactions || []}
            />
            <EmojiPicker onSelect={handleEmojiSelect} />
          </div>
        </div>
      </div>

      {authorId && (
        <UserProfileDialog
          userId={authorId}
          open={showProfile}
          onOpenChange={setShowProfile}
        />
      )}
    </>
  );
}

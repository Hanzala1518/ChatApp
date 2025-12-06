"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchDialog } from "@/components/search/SearchDialog";
import { getInitials } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface DMHeaderProps {
  otherUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function DMHeader({ otherUser }: DMHeaderProps) {
  const { onlineUsers } = useAppStore();
  const isOnline = onlineUsers.has(otherUser.id);

  return (
    <div className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-6 gap-3">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>
            {getInitials(otherUser.display_name)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>

      <div className="flex-1">
        <h2 className="font-semibold text-lg">{otherUser.display_name}</h2>
        <p className="text-xs text-muted-foreground">
          @{otherUser.username}
          {isOnline && <span className="ml-2 text-green-500">● Online</span>}
        </p>
      </div>
      
      <SearchDialog />
    </div>
  );
}

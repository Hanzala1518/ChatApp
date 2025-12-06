import { Hash, Lock, Users, Info } from 'lucide-react';
import { SearchDialog } from '@/components/search/SearchDialog';
import { Button } from '@/components/ui/button';
import type { Channel } from '@/lib/types';

interface ChannelHeaderProps {
  channel: Channel;
  memberCount?: number;
  onInfoClick?: () => void;
}

export function ChannelHeader({ channel, memberCount, onInfoClick }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {channel.is_private ? (
          <Lock className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Hash className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <h2 className="text-xl font-bold">{channel.name}</h2>
          {memberCount !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onInfoClick}>
          <Info className="h-5 w-5" />
        </Button>
        <SearchDialog />
      </div>
    </div>
  );
}

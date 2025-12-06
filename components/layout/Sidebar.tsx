'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Hash, Lock, Plus, Menu, LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useAppStore } from '@/lib/store';
import type { Channel, ChannelWithMembership, Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { CreateChannelDialog } from '@/components/channels/CreateChannelDialog';
import { JoinChannelDialog } from '@/components/channels/JoinChannelDialog';
import { JoinPrivateChannelDialog } from '@/components/channels/JoinPrivateChannelDialog';
import { DMList } from '@/components/dms/DMList';
import { StartDMDialog } from '@/components/dms/StartDMDialog';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
  initialChannels: ChannelWithMembership[];
  currentUser: Profile;
}

export function Sidebar({ initialChannels, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isSidebarCollapsed, toggleSidebar, onlineUsers } = useAppStore();
  const [channels, setChannels] = useState<ChannelWithMembership[]>(initialChannels);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelWithMembership | null>(null);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  const handleChannelClick = (channel: ChannelWithMembership, e: React.MouseEvent) => {
    // If it's a private channel and user is not a member, show join dialog
    if (channel.is_private && !channel.isMember) {
      e.preventDefault();
      setSelectedChannel(channel);
      setJoinDialogOpen(true);
    }
    // Otherwise, normal navigation will happen via Link
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    // Subscribe to channel changes
    const channelSubscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // New channels - assume user is member if they created it
          const newChannel = payload.new as ChannelWithMembership;
          newChannel.isMember = newChannel.created_by === currentUser.id;
          setChannels((prev) => [...prev, newChannel]);
        } else if (payload.eventType === 'UPDATE') {
          setChannels((prev) =>
            prev.map((ch) => (ch.id === payload.new.id ? { ...ch, ...(payload.new as any) } : ch))
          );
        } else if (payload.eventType === 'DELETE') {
          setChannels((prev) => prev.filter((ch) => ch.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      channelSubscription.unsubscribe();
    };
  }, [supabase, currentUser.id]);

  return (
    <aside
      className={`flex flex-col h-full border-r bg-card/50 backdrop-blur-sm gradient-sidebar-light dark:gradient-sidebar-dark transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isSidebarCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ChatApp
          </h1>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Channels */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </span>
              <CreateChannelDialog />
            </div>
          )}
          
          {!isSidebarCollapsed && (
            <JoinChannelDialog />
          )}

          {channels.map((channel) => {
            const itemKey = `channel-${channel.id}`;
            const isActive = pathname === `/channels/${channel.id}`;
            const isPrivateAndNotMember = channel.is_private && !channel.isMember;
            
            return (
              <Link
                key={itemKey}
                href={isPrivateAndNotMember ? '#' : `/channels/${channel.id}`}
                onClick={(e) => handleChannelClick(channel, e)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth hover:bg-accent/50 ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                } ${isPrivateAndNotMember ? 'opacity-60' : ''}`}
              >
                {channel.is_private ? (
                  <Lock className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Hash className="h-4 w-4 flex-shrink-0" />
                )}
                {!isSidebarCollapsed && (
                  <span className="truncate text-sm font-medium">{channel.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {!isSidebarCollapsed && (
          <div className="mt-6">
            <div className="px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Direct Messages
              </span>
            </div>
            <StartDMDialog />
            <DMList />
          </div>
        )}
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={currentUser.avatar_url || undefined} />
              <AvatarFallback>{getInitials(currentUser.display_name)}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                isOnline(currentUser.id) ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.display_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser.status_message || 'Available'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!isSidebarCollapsed && (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Join Private Channel Dialog */}
      {selectedChannel && (
        <JoinPrivateChannelDialog
          channel={selectedChannel}
          open={joinDialogOpen}
          onOpenChange={(open) => {
            setJoinDialogOpen(open);
            if (!open) setSelectedChannel(null);
          }}
          onJoined={() => {
            // Update the channel in local state to mark as member
            setChannels((prev) =>
              prev.map((ch) =>
                ch.id === selectedChannel.id ? { ...ch, isMember: true } : ch
              )
            );
            setJoinDialogOpen(false);
            setSelectedChannel(null);
            // Navigate to the channel
            router.push(`/channels/${selectedChannel.id}`);
          }}
        />
      )}
    </aside>
  );
}

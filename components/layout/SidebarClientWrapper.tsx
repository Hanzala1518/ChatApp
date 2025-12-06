'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import type { Channel, Profile } from '@/lib/types';

interface SidebarClientWrapperProps {
  initialChannels: Channel[];
  currentUser: Profile;
}

export default function SidebarClientWrapper({
  initialChannels,
  currentUser,
}: SidebarClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render dialogs until client-side hydration is complete
  if (!mounted) {
    return (
      <aside className="flex flex-col h-full border-r bg-card/50 backdrop-blur-sm w-64">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ChatApp
          </h1>
        </div>
        <div className="flex-1 px-3 py-4 space-y-2">
          {initialChannels.slice(0, 5).map((channel) => (
            <div key={channel.id} className="h-8 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </aside>
    );
  }

  return <Sidebar initialChannels={initialChannels} currentUser={currentUser} />;
}

import { create } from 'zustand';
import type { PresenceState } from './types';

interface AppStore {
  // Online users (presence)
  onlineUsers: Map<string, PresenceState>;
  setOnlineUsers: (users: Map<string, PresenceState>) => void;
  addOnlineUser: (userId: string, state: PresenceState) => void;
  removeOnlineUser: (userId: string) => void;
  
  // Current selection
  selectedChannelId: string | null;
  selectedConversationId: string | null;
  setSelectedChannel: (channelId: string | null) => void;
  setSelectedConversation: (conversationId: string | null) => void;
  
  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Presence
  onlineUsers: new Map(),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (userId, state) =>
    set((prev) => {
      const newMap = new Map(prev.onlineUsers);
      newMap.set(userId, state);
      return { onlineUsers: newMap };
    }),
  removeOnlineUser: (userId) =>
    set((prev) => {
      const newMap = new Map(prev.onlineUsers);
      newMap.delete(userId);
      return { onlineUsers: newMap };
    }),
  
  // Selection
  selectedChannelId: null,
  selectedConversationId: null,
  setSelectedChannel: (channelId) =>
    set({ selectedChannelId: channelId, selectedConversationId: null }),
  setSelectedConversation: (conversationId) =>
    set({ selectedConversationId: conversationId, selectedChannelId: null }),
  
  // Sidebar
  isSidebarCollapsed: false,
  toggleSidebar: () => set((prev) => ({ isSidebarCollapsed: !prev.isSidebarCollapsed })),
}));

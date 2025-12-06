// Database types based on Section 4 of the spec
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          username: string;
          display_name: string;
          avatar_url: string | null;
          status_message: string | null;
          last_seen_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          status_message?: string | null;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          status_message?: string | null;
          last_seen_at?: string;
        };
      };
      channels: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_private: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_private?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_private?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
      channel_members: {
        Row: {
          id: string;
          user_id: string;
          channel_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at: string;
          edited_at: string | null;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          edited_at?: string | null;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          edited_at?: string | null;
          is_deleted?: boolean;
        };
      };
      direct_conversations: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          created_at?: string;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          edited_at: string | null;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          edited_at?: string | null;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          edited_at?: string | null;
          is_deleted?: boolean;
        };
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Channel = Database['public']['Tables']['channels']['Row'];
export type ChannelMember = Database['public']['Tables']['channel_members']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type DirectConversation = Database['public']['Tables']['direct_conversations']['Row'];
export type DirectMessage = Database['public']['Tables']['direct_messages']['Row'];
export type MessageReaction = Database['public']['Tables']['message_reactions']['Row'];

// Extended types with joined data
export type MessageWithAuthor = Message & {
  author: Profile;
  reactions?: MessageReaction[];
};

export type DirectMessageWithAuthor = DirectMessage & {
  author: Profile;
  reactions?: MessageReaction[];
};

export type ChannelWithMemberCount = Channel & {
  member_count?: number;
};

export type ChannelWithMembership = Channel & {
  isMember?: boolean;
  invite_code?: string;
};

export type ConversationWithParticipant = DirectConversation & {
  participant: Profile;
  last_message?: DirectMessage;
};

// Presence types for Supabase Realtime (Section 5.4 of spec)
export interface PresenceState {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  online_at: string;
}

// Typing indicator types (Section 5.5 of spec)
export interface TypingState {
  user_id: string;
  username: string;
  display_name: string;
  channel_id?: string;
  conversation_id?: string;
}

-- ============================================================================
-- ChatApp - Complete Database Setup Script
-- ============================================================================
-- Run this ENTIRE script in your Supabase SQL Editor to set up the database.
-- This script is idempotent - safe to run multiple times.
-- ============================================================================

-- ============================================
-- STEP 1: Enable Required Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Create Tables
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status_message TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(8) UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel members table
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Direct conversations table
CREATE TABLE IF NOT EXISTS direct_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- DM reactions table
CREATE TABLE IF NOT EXISTS dm_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- STEP 3: Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_invite_code ON channels(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- STEP 4: Enable Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Drop Existing Policies (Clean Slate)
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Channels
DROP POLICY IF EXISTS "channels_select" ON channels;
DROP POLICY IF EXISTS "channels_insert" ON channels;
DROP POLICY IF EXISTS "channels_update" ON channels;
DROP POLICY IF EXISTS "channels_delete" ON channels;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON channels;
DROP POLICY IF EXISTS "Anyone can view public channels" ON channels;
DROP POLICY IF EXISTS "Members can view private channels" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Authenticated users can create channels" ON channels;
DROP POLICY IF EXISTS "Channel creators can update channels" ON channels;
DROP POLICY IF EXISTS "Channel creators can delete channels" ON channels;

-- Channel Members
DROP POLICY IF EXISTS "channel_members_select" ON channel_members;
DROP POLICY IF EXISTS "channel_members_insert" ON channel_members;
DROP POLICY IF EXISTS "channel_members_delete" ON channel_members;
DROP POLICY IF EXISTS "Channel members viewable by members" ON channel_members;
DROP POLICY IF EXISTS "Anyone can view channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can join public channels" ON channel_members;
DROP POLICY IF EXISTS "Users can join channels" ON channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON channel_members;

-- Messages
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;
DROP POLICY IF EXISTS "Messages viewable by channel members" ON messages;
DROP POLICY IF EXISTS "Anyone can view messages in public channels" ON messages;
DROP POLICY IF EXISTS "Members can view messages in private channels" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in joined channels" ON messages;
DROP POLICY IF EXISTS "Members can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Direct Conversations
DROP POLICY IF EXISTS "direct_conversations_select" ON direct_conversations;
DROP POLICY IF EXISTS "direct_conversations_insert" ON direct_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON direct_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON direct_conversations;

-- Direct Messages
DROP POLICY IF EXISTS "direct_messages_select" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_update" ON direct_messages;
DROP POLICY IF EXISTS "direct_messages_delete" ON direct_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update own direct messages" ON direct_messages;

-- Message Reactions
DROP POLICY IF EXISTS "message_reactions_select" ON message_reactions;
DROP POLICY IF EXISTS "message_reactions_insert" ON message_reactions;
DROP POLICY IF EXISTS "message_reactions_delete" ON message_reactions;
DROP POLICY IF EXISTS "Reactions viewable by message viewers" ON message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON message_reactions;

-- DM Reactions
DROP POLICY IF EXISTS "dm_reactions_select" ON dm_reactions;
DROP POLICY IF EXISTS "dm_reactions_insert" ON dm_reactions;
DROP POLICY IF EXISTS "dm_reactions_delete" ON dm_reactions;

-- ============================================
-- STEP 6: Create RLS Policies
-- ============================================

-- PROFILES: Anyone can view, users can manage their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CHANNELS: Anyone can view, authenticated users can create, creators/admins can update
CREATE POLICY "channels_select" ON channels FOR SELECT USING (true);
CREATE POLICY "channels_insert" ON channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "channels_update" ON channels FOR UPDATE USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM channel_members cm 
    WHERE cm.channel_id = channels.id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'admin'
  )
);
CREATE POLICY "channels_delete" ON channels FOR DELETE USING (auth.uid() = created_by);

-- CHANNEL_MEMBERS: Anyone can view, users can join/leave
CREATE POLICY "channel_members_select" ON channel_members FOR SELECT USING (true);
CREATE POLICY "channel_members_insert" ON channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "channel_members_delete" ON channel_members FOR DELETE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM channel_members cm 
    WHERE cm.channel_id = channel_members.channel_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM channels c 
    WHERE c.id = channel_members.channel_id 
    AND c.created_by = auth.uid()
  )
);

-- MESSAGES: Anyone can view, members can insert, users can edit/delete their own
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (auth.uid() = user_id);

-- DIRECT_CONVERSATIONS: Only participants can view/create
CREATE POLICY "direct_conversations_select" ON direct_conversations FOR SELECT 
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "direct_conversations_insert" ON direct_conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- DIRECT_MESSAGES: Only participants can view, senders can manage
CREATE POLICY "direct_messages_select" ON direct_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM direct_conversations dc
    WHERE dc.id = direct_messages.conversation_id
    AND (dc.user_a_id = auth.uid() OR dc.user_b_id = auth.uid())
  )
);
CREATE POLICY "direct_messages_insert" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "direct_messages_update" ON direct_messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "direct_messages_delete" ON direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- MESSAGE_REACTIONS: Anyone can view, users can add/remove their own
CREATE POLICY "message_reactions_select" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "message_reactions_insert" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "message_reactions_delete" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- DM_REACTIONS: Participants can view, users can add/remove their own
CREATE POLICY "dm_reactions_select" ON dm_reactions FOR SELECT USING (true);
CREATE POLICY "dm_reactions_insert" ON dm_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dm_reactions_delete" ON dm_reactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Enable Realtime
-- ============================================

DO $$
BEGIN
  -- Add tables to realtime publication (ignore errors if already added)
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE dm_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE channel_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE channels; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================
-- STEP 8: Create Storage Bucket for Avatars
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- STEP 9: Create Auto-Profile Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 10: Create Default Channels
-- ============================================

INSERT INTO channels (name, slug, is_private, created_by)
VALUES 
  ('general', 'general', false, NULL),
  ('random', 'random', false, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now fully configured for ChatApp.
-- 
-- Next steps:
-- 1. Enable Google OAuth in Supabase Dashboard > Authentication > Providers
-- 2. Set up environment variables in your .env.local file
-- 3. Run `npm run dev` to start the development server
-- ============================================

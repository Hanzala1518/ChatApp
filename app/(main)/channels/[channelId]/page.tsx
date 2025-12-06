import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';
import { ChannelPageClient } from './ChannelPageClient';
import type { Channel } from '@/lib/types';

interface ChannelPageProps {
  params: Promise<{
    channelId: string;
  }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch channel details (invite_code is optional - may not exist yet)
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (channelError || !channel) {
    redirect('/');
  }

  const typedChannel = channel as Channel & { invite_code?: string };

  // Check if user is a member (or if it's a public channel)
  // Use maybeSingle() to return null instead of error when no membership exists
  const { data: membership } = await supabase
    .from('channel_members')
    .select('*')
    .eq('channel_id', channelId)
    .eq('user_id', user.id)
    .maybeSingle();

  // If private channel and not a member, redirect away
  if (typedChannel.is_private && !membership) {
    redirect('/');
  }

  // Auto-join public channels
  if (!typedChannel.is_private && !membership) {
    const { error: joinError } = await supabase
      .from('channel_members')
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        channel_id: channelId,
        user_id: user.id,
        role: 'member',
      });
    
    if (joinError) {
      console.error('Auto-join error:', joinError);
      // Continue anyway - user might already be a member
    }
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('channel_members')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  // Fetch initial messages (without foreign key join)
  const { data: rawMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(50);

  // Fetch author profiles for all messages
  const authorIds = [...new Set((rawMessages || []).map((m: any) => m.user_id))];
  const { data: authorProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', authorIds);

  const profileMap = new Map((authorProfiles || []).map((p: any) => [p.id, p]));
  const messages = (rawMessages || []).map((m: any) => ({
    ...m,
    author: profileMap.get(m.user_id) || null,
    reactions: [],
  }));

  return (
    <ChannelPageClient
      channel={typedChannel}
      memberCount={memberCount || 0}
      messages={messages}
      currentUserId={user.id}
    />
  );
}

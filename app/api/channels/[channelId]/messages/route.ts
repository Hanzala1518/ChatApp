import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // timestamp for pagination

    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the channel (for private channels)
    const { data: channelData } = await supabase
      .from('channels')
      .select('is_private')
      .eq('id', channelId)
      .single();

    const channelInfo = channelData as { is_private: boolean } | null;
    
    if (channelInfo && channelInfo.is_private) {
      const { data: membership } = await supabase
        .from('channel_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: 'You must be a member to view messages' }, { status: 403 });
      }
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch author profiles for messages
    const userIds = [...new Set((messages || []).map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);
    
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    
    const messagesWithAuthors = (messages || []).map((m: any) => ({
      ...m,
      author: profileMap.get(m.user_id) || null,
    }));

    return NextResponse.json({ messages: messagesWithAuthors.reverse() });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the channel
    const { data: membership } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'You must be a member of this channel to send messages' }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    //@ts-ignore
    const { data: message, error } = await supabase
      .from('messages')
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Message insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch author profile
    const { data: author } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ message: { ...(message as any), author } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

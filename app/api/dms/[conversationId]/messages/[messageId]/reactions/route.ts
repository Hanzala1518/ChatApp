import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const { conversationId, messageId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Verify user is part of the conversation
    const { data: conversation } = await supabase
      .from('direct_conversations')
      .select('user_a_id, user_b_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conv = conversation as { user_a_id: string; user_b_id: string };
    if (conv.user_a_id !== user.id && conv.user_b_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('dm_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existingReaction) {
      // Remove reaction (toggle off)
      // @ts-ignore - Supabase type inference issue
      await supabase
        .from('dm_reactions')
        .delete()
        // @ts-ignore
        .eq('id', existingReaction.id);

      return NextResponse.json({ action: 'removed' });
    }

    // Add reaction
    const { error } = await supabase
      .from('dm_reactions')
      // @ts-ignore - Supabase type inference issue
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

    if (error) {
      console.error('Reaction error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ action: 'added' }, { status: 201 });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const { conversationId, messageId } = await params;
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is part of the conversation
    const { data: conversation } = await supabase
      .from('direct_conversations')
      .select('user_a_id, user_b_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conv = conversation as { user_a_id: string; user_b_id: string };
    if (conv.user_a_id !== user.id && conv.user_b_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: reactions, error } = await supabase
      .from('dm_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reactions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

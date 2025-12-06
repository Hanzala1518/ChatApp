import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { sendMessageSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("direct_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if ((conversation as any).user_a_id !== user.id && (conversation as any).user_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from("direct_messages")
      .select('*')
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

    // Fetch sender profiles
    const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', senderIds);
    
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    
    const messagesWithSenders = (messages || []).map((m: any) => ({
      ...m,
      sender: profileMap.get(m.sender_id) || null,
    }));

    // Reverse to show oldest first in UI
    const messagesReversed = messagesWithSenders.reverse();

    return NextResponse.json({ messages: messagesReversed });
  } catch (error) {
    console.error("Error fetching DM messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const { data: conversation } = await supabase
      .from("direct_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if ((conversation as any).user_a_id !== user.id && (conversation as any).user_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { content } = validation.data;

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from("direct_messages")
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    // Fetch sender profile
    const { data: sender } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ message: { ...(message as any), sender } }, { status: 201 });
  } catch (error) {
    console.error("Error sending DM:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

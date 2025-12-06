import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const channelId = searchParams.get("channelId");

    if (!query || query.trim() === "") {
      return NextResponse.json({ messages: [] });
    }

    // Search in channel messages
    let channelQuery = supabase
      .from("messages")
      .select('*')
      .ilike("content", `%${query}%`)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (channelId) {
      channelQuery = channelQuery.eq("channel_id", channelId);
    }

    const { data: channelMessages, error: channelError } = await channelQuery;

    if (channelError) throw channelError;

    // Fetch authors and channels for messages
    const userIds = [...new Set((channelMessages || []).map((m: any) => m.user_id))];
    const channelIds = [...new Set((channelMessages || []).map((m: any) => m.channel_id))];
    
    const [{ data: profiles }, { data: channels }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', userIds),
      supabase.from('channels').select('*').in('id', channelIds),
    ]);
    
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const channelMap = new Map((channels || []).map((c: any) => [c.id, c]));

    const channelMessagesWithData = (channelMessages || []).map((m: any) => ({
      ...m,
      author: profileMap.get(m.user_id) || null,
      channel: channelMap.get(m.channel_id) || null,
      type: "channel",
    }));

    // Search in DMs
    const { data: conversations } = await supabase
      .from("direct_conversations")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    const conversationIds = (conversations || []).map((c: any) => c.id);

    let dmMessagesWithData: any[] = [];
    if (conversationIds.length > 0 && !channelId) {
      const { data: dmMessages, error: dmError } = await supabase
        .from("direct_messages")
        .select('*')
        .in("conversation_id", conversationIds)
        .ilike("content", `%${query}%`)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!dmError && dmMessages) {
        const senderIds = [...new Set(dmMessages.map((m: any) => m.sender_id))];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);
        
        const senderMap = new Map((senderProfiles || []).map((p: any) => [p.id, p]));
        
        dmMessagesWithData = dmMessages.map((m: any) => ({
          ...m,
          sender: senderMap.get(m.sender_id) || null,
          type: "dm",
        }));
      }
    }

    const results = [
      ...channelMessagesWithData,
      ...dmMessagesWithData,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ messages: results.slice(0, 50) });
  } catch (error) {
    console.error("Error searching messages:", error);
    return NextResponse.json(
      { error: "Failed to search messages" },
      { status: 500 }
    );
  }
}

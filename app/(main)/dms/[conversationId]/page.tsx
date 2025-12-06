import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { DMHeader } from "@/components/dms/DMHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import type { DirectConversation, Profile } from "@/lib/types";

export default async function DMPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get conversation
  //@ts-ignore
  const { data: conversation } = await supabase
    .from("direct_conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    redirect("/");
  }

  const typedConversation = conversation as DirectConversation;

  // Verify user is part of this conversation
  if (typedConversation.user_a_id !== user.id && typedConversation.user_b_id !== user.id) {
    redirect("/");
  }

  // Get the other user's profile
  const otherUserId = typedConversation.user_a_id === user.id 
    ? typedConversation.user_b_id 
    : typedConversation.user_a_id;

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", otherUserId)
    .single();

  if (!otherUser) {
    redirect("/");
  }

  const typedOtherUser = otherUser as Profile;

  // Fetch initial messages (without foreign key join)
  const { data: rawMessages } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch sender profiles for all messages
  const senderIds = [...new Set((rawMessages || []).map((m: any) => m.sender_id))];
  const { data: senderProfiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", senderIds);

  const profileMap = new Map((senderProfiles || []).map((p: any) => [p.id, p]));
  const messagesWithSender = (rawMessages || []).map((m: any) => ({
    ...m,
    sender: profileMap.get(m.sender_id) || null,
    author: profileMap.get(m.sender_id) || null,
  }));

  const messagesReversed = messagesWithSender.reverse();

  return (
    <div className="flex flex-col h-full">
      <DMHeader otherUser={typedOtherUser} />
      <MessageList
        initialMessages={messagesReversed}
        conversationId={conversationId}
        currentUserId={user.id}
        isDM={true}
      />
      <MessageInput conversationId={conversationId} isDM={true} />
    </div>
  );
}

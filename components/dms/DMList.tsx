"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabaseClient";
import { getInitials, formatTimestamp } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { MessageSquare } from "lucide-react";

interface DMConversation {
  id: string;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

export function DMList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedConversationId, setSelectedConversation, onlineUsers } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
    
    // Subscribe to new DM messages
    const channel = supabase
      .channel("dm-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all conversations for this user
      const { data: convos, error } = await supabase
        .from("direct_conversations")
        .select(`
          id,
          user_a_id,
          user_b_id,
          created_at
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each conversation, get the other user's profile and last message
      const conversationsWithData = await Promise.all(
        (convos || []).map(async (convo: any) => {
          const otherUserId = convo.user_a_id === user.id ? convo.user_b_id : convo.user_a_id;

          // Get other user's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", otherUserId)
            .single();

          // Get last message
          const { data: lastMsgList } = await supabase
            .from("direct_messages")
            .select("content, created_at")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsg = lastMsgList && lastMsgList.length > 0 ? lastMsgList[0] : null;

          return {
            id: convo.id,
            other_user: profile || {
              id: otherUserId,
              username: "Unknown",
              display_name: "Unknown User",
              avatar_url: null,
            },
            last_message: lastMsg,
          };
        })
      );

      setConversations(conversationsWithData);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleConversationClick(conversationId: string) {
    setSelectedConversation(conversationId);
    router.push(`/dms/${conversationId}`);
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-2">
        {conversations.map((convo) => {
          const isOnline = onlineUsers.has(convo.other_user.id);
          const isSelected = selectedConversationId === convo.id;

          return (
            <button
              key={convo.id}
              onClick={() => handleConversationClick(convo.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={convo.other_user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(convo.other_user.display_name)}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-sm truncate">
                  {convo.other_user.display_name}
                </div>
                {convo.last_message && (
                  <div className="text-xs text-muted-foreground truncate">
                    {convo.last_message.content}
                  </div>
                )}
              </div>

              {convo.last_message && (
                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(convo.last_message.created_at)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

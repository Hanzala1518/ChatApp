"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabaseClient";
import { getInitials } from "@/lib/utils";
import { MessageSquarePlus, Search } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function StartDMDialog() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.display_name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  async function loadUsers() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .neq("id", currentUser.id)
        .order("display_name");

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  }

  async function startConversation(otherUserId: string) {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Normalize user IDs (smaller ID first)
      const [userA, userB] = [user.id, otherUserId].sort();

      // Check if conversation already exists
      const { data: existingList } = await supabase
        .from("direct_conversations")
        .select("id")
        .eq("user_a_id", userA)
        .eq("user_b_id", userB)
        .limit(1);

      const existing = existingList && existingList.length > 0 ? existingList[0] : null;
      let conversationId: string;

      if (existing) {
        conversationId = (existing as any).id;
      } else {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from("direct_conversations")
          // @ts-ignore - Supabase type inference issue with insert
          .insert({
            user_a_id: userA,
            user_b_id: userB,
          })
          .select("id")
          .single();

        if (error || !newConvo) throw error || new Error('Failed to create conversation');
        conversationId = (newConvo as any).id;
      }

      setOpen(false);
      router.push(`/dms/${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Conversation</DialogTitle>
          <DialogDescription>
            Select a user to start a direct message conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">
                      {user.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

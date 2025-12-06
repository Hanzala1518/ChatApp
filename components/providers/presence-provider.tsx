"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useAppStore } from "@/lib/store";
import type { PresenceState } from "@/lib/types";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { setOnlineUsers, addOnlineUser, removeOnlineUser } = useAppStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setupPresence() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Clean up existing channel
        if (channelRef.current) {
          await channelRef.current.unsubscribe();
        }

        const presenceChannel = supabase.channel("presence:global");
        channelRef.current = presenceChannel;

        presenceChannel
          .on("presence", { event: "sync" }, () => {
            if (!mounted) return;
            const state = presenceChannel.presenceState();
            const onlineUsersMap = new Map<string, PresenceState>();

            Object.values(state).forEach((presences: any) => {
              presences.forEach((presence: any) => {
                if (presence.user_id) {
                  onlineUsersMap.set(presence.user_id, {
                    user_id: presence.user_id,
                    username: presence.username,
                    display_name: presence.display_name,
                    online_at: presence.online_at,
                  });
                }
              });
            });

            setOnlineUsers(onlineUsersMap);
          })
          .on("presence", { event: "join" }, ({ newPresences }) => {
            if (!mounted) return;
            newPresences.forEach((presence: any) => {
              if (presence.user_id) {
                addOnlineUser(presence.user_id, {
                  user_id: presence.user_id,
                  username: presence.username,
                  display_name: presence.display_name,
                  online_at: presence.online_at,
                });
              }
            });
          })
          .on("presence", { event: "leave" }, ({ leftPresences }) => {
            if (!mounted) return;
            leftPresences.forEach((presence: any) => {
              if (presence.user_id) {
                removeOnlineUser(presence.user_id);
              }
            });
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED" && mounted) {
              // Get user profile for presence data
              const { data: profile } = await supabase
                .from("profiles")
                .select("username, display_name")
                .eq("id", user.id)
                .single();

              await presenceChannel.track({
                user_id: user.id,
                username: (profile as any)?.username || "unknown",
                display_name: (profile as any)?.display_name || "Unknown User",
                online_at: new Date().toISOString(),
              });
            }
          });
      } catch (error) {
        console.error("Presence setup error:", error);
      }
    }

    setupPresence();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return <>{children}</>;
}

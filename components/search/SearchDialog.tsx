"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, Hash, MessageSquare } from "lucide-react";
import { getInitials, formatMessageTime } from "@/lib/utils";
import { toast } from "sonner";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search/messages?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.messages || []);
    } catch (error) {
      toast.error("Failed to search messages");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: any) => {
    if (result.type === "channel") {
      router.push(`/channels/${result.channel_id}`);
    } else {
      router.push(`/dms/${result.conversation_id}`);
    }
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
          <DialogDescription>
            Search across all channels and direct messages
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {results.length === 0 && !isSearching && query && (
            <div className="text-center py-12 text-muted-foreground">
              No results found
            </div>
          )}

          {isSearching && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={
                        result.type === "channel"
                          ? result.author?.avatar_url
                          : result.sender?.avatar_url
                      }
                    />
                    <AvatarFallback>
                      {getInitials(
                        result.type === "channel"
                          ? result.author?.display_name || "U"
                          : result.sender?.display_name || "U"
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.type === "channel" ? (
                        <>
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {result.channel?.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Direct Message</span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(result.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {result.type === "channel"
                        ? result.author?.display_name
                        : result.sender?.display_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {result.content}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

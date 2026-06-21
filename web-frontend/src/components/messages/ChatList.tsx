import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ListTodo } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { chatsApi } from "../../services/api";
import type { Chat } from "shared";

interface ChatListProps {
    selectedChatId: string | null;
    onSelectChat: (chat: Chat) => void;
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
    const [searchKeyword, setSearchKeyword] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["chats"],
        queryFn: () => chatsApi.getChats(),
    });

    const chats = data?.chats ?? [];

    const filteredChats = searchKeyword
        ? chats.filter(
              (c) =>
                  c.displayName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                  c.members.some((m) => m.name.toLowerCase().includes(searchKeyword.toLowerCase()))
          )
        : chats;

    const formatTime = (date: Date | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        }
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    return (
        <div className="flex flex-col h-full border-r">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading chats...</div>
                ) : filteredChats.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No chats found</div>
                ) : (
                    filteredChats.map((chat) => (
                        <button
                            key={chat.chatId}
                            onClick={() => onSelectChat(chat)}
                            className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                                selectedChatId === chat.chatId ? "bg-muted" : ""
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{chat.displayName}</span>
                                        {chat.openTaskCount > 0 && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-0.5 shrink-0">
                                                <ListTodo className="h-3 w-3" />
                                                {chat.openTaskCount}
                                            </Badge>
                                        )}
                                    </div>
                                    {chat.lastMessagePreview && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {chat.lastMessagePreview}
                                        </p>
                                    )}
                                </div>
                                {chat.lastMessageTime && (
                                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                        {formatTime(chat.lastMessageTime)}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

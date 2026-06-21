import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, PenLine, Sparkles, ListTodo, Users, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { chatsApi } from "../../services/api";
import type { Chat, MessageWithContext } from "shared";

interface ChatViewProps {
    chat: Chat;
}

export function ChatView({ chat }: ChatViewProps) {
    const navigate = useNavigate();
    const [allMessages, setAllMessages] = useState<MessageWithContext[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat detail (description + members)
    const { data: detailData, isLoading: detailLoading } = useQuery({
        queryKey: ["chatDetail", chat.chatId],
        queryFn: () => chatsApi.getChatDetail(chat.chatId),
    });

    // Fetch initial messages
    const { data: messagesData, isLoading: messagesLoading } = useQuery({
        queryKey: ["chatMessages", chat.chatId],
        queryFn: () => chatsApi.getChatMessages(chat.chatId, { pageSize: 50 }),
    });

    // Reset messages when chat changes and scroll to bottom
    useEffect(() => {
        if (messagesData) {
            setAllMessages(messagesData.messages);
            setNextPageToken(messagesData.nextPageToken);
            // Scroll to bottom after messages render
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView();
            }, 0);
        }
    }, [messagesData]);

    const loadMore = useCallback(async () => {
        if (!nextPageToken || loadingMore) return;
        setLoadingMore(true);
        try {
            const response = await chatsApi.getChatMessages(chat.chatId, {
                pageSize: 50,
                pageToken: nextPageToken,
            });
            setAllMessages((prev) => [...prev, ...response.messages]);
            setNextPageToken(response.nextPageToken);
        } catch (error) {
            console.error("Failed to load more messages:", error);
        }
        setLoadingMore(false);
    }, [chat.chatId, nextPageToken, loadingMore]);

    const handleSmartSearch = () => {
        const prefill = `Search my messages in "${chat.displayName}" for: `;
        navigate(`/agent?prefill=${encodeURIComponent(prefill)}`);
    };

    const handleDraftResponse = () => {
        const recentContext = allMessages
            .slice(0, 5)
            .reverse()
            .map((m) => `${m.senderName}: ${m.content}`)
            .join("\n");
        const prefill = `Draft a response in my conversation with ${chat.displayName}. Here's the recent context:\n${recentContext}\n\nDraft a response:`;
        navigate(`/agent?prefill=${encodeURIComponent(prefill)}`);
    };

    const handleSearchAll = () => {
        navigate(`/agent?prefill=${encodeURIComponent("Search across all my messages for: ")}`);
    };

    const handleOpenTasks = () => {
        navigate(`/tasks?chatId=${encodeURIComponent(chat.chatId)}&chatName=${encodeURIComponent(chat.displayName)}`);
    };

    const formatTime = (date: Date | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const detail = detailData;
    const members = detail?.chat.members ?? chat.members;

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="border-b p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{chat.displayName}</h3>
                    <div className="flex items-center gap-2">
                        {chat.openTaskCount > 0 && (
                            <Button variant="outline" size="sm" onClick={handleOpenTasks}>
                                <ListTodo className="mr-1.5 h-4 w-4" />
                                {chat.openTaskCount} Open {chat.openTaskCount === 1 ? "Task" : "Tasks"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Members */}
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                        {members.map((m) => (
                            <Badge key={m.userId} variant="outline" className="text-xs">
                                {m.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Description */}
                {detailLoading ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating summary...
                    </p>
                ) : (
                    detail?.description && (
                        <p className="text-sm text-muted-foreground">{detail.description}</p>
                    )
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSmartSearch}>
                        <Search className="mr-1.5 h-4 w-4" />
                        Smart Search
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDraftResponse}>
                        <PenLine className="mr-1.5 h-4 w-4" />
                        Draft Response
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSearchAll}>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        Search All Messages
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                ) : allMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">No messages in this chat</p>
                    </div>
                ) : (
                    <>
                        {/* Load more button at top (since messages are newest-first) */}
                        {nextPageToken && (
                            <div className="flex justify-center pb-2">
                                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load older messages"
                                    )}
                                </Button>
                            </div>
                        )}
                        {[...allMessages].reverse().map((msg) => (
                            <div
                                key={msg.messageId}
                                className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                        msg.isFromMe
                                            ? "bg-gray-900 text-white"
                                            : "bg-muted"
                                    }`}
                                >
                                    {!msg.isFromMe && (
                                        <p className="text-xs font-medium mb-0.5 text-muted-foreground">
                                            {msg.senderName}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <p
                                        className={`text-[10px] mt-1 ${
                                            msg.isFromMe ? "text-gray-400" : "text-muted-foreground"
                                        }`}
                                    >
                                        {formatTime(msg.timeReceived)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
        </div>
    );
}

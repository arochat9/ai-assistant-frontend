import { MessageSquare } from "lucide-react";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { messagesApi } from "../../services/api";
import type { Message } from "shared";

interface TaskMessagesProps {
    sourceMessageIds: string[];
}

export function TaskMessages({ sourceMessageIds }: TaskMessagesProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sourceMessageIds.length) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchMessages = async () => {
            try {
                const response = await messagesApi.getMessages({ messageIds: sourceMessageIds });
                if (!cancelled) {
                    setMessages(response.messages);
                    setLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch source messages:", error);
                    setLoading(false);
                }
            }
        };

        fetchMessages();

        return () => {
            cancelled = true;
        };
    }, [sourceMessageIds]);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Source Messages
                </h4>
                {!loading && messages.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {messages.length} {messages.length === 1 ? "message" : "messages"}
                    </Badge>
                )}
            </div>
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No source messages</p>
            ) : (
                <div className="space-y-2">
                    {messages.map((msg) => (
                        <div key={msg.messageId} className="border rounded-lg p-3 bg-muted/30">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{msg.senderName}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

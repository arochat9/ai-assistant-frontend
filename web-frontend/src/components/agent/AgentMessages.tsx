import { useRef, useEffect } from "react";
import type { Message } from "ai";
import { MessageItem } from "./MessageItem";

interface AgentMessagesProps {
    messages: Message[];
}

export function AgentMessages({ messages }: AgentMessagesProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="relative flex-1">
            <div className="absolute inset-0 overflow-y-auto">
                <div className="mx-auto flex min-w-0 max-w-3xl flex-col gap-6 px-4 py-4">
                    {messages.length === 0 ? (
                        <div className="mx-auto mt-16 flex size-full max-w-3xl flex-col justify-center px-4">
                            <div className="mb-4 text-2xl font-semibold">Hello there!</div>
                            <div className="text-xl text-muted-foreground">How can I help you today?</div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <MessageItem key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

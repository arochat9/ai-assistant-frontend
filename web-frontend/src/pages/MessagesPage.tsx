import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { MessagesMetrics } from "../components/messages/MessagesMetrics";
import { ChatList } from "../components/messages/ChatList";
import { ChatView } from "../components/messages/ChatView";
import type { Chat } from "shared";

export function MessagesPage() {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 pb-0">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold">Messages</h2>
                    <p className="text-sm text-muted-foreground">Browse your chats and messages</p>
                </div>
                <MessagesMetrics />
            </div>

            <div className="flex-1 min-h-0 flex">
                {/* Chat List - left panel */}
                <div className="w-80 shrink-0">
                    <ChatList
                        selectedChatId={selectedChat?.chatId ?? null}
                        onSelectChat={setSelectedChat}
                    />
                </div>

                {/* Chat View - right panel */}
                <div className="flex-1 min-w-0">
                    {selectedChat ? (
                        <ChatView chat={selectedChat} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Select a chat to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

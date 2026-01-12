import { memo } from "react";
import { Sparkles } from "lucide-react";
import type { Message } from "ai";
import { Streamdown } from "streamdown";

interface MessageItemProps {
    message: Message;
}

export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
    return (
        <div className="group/message fade-in w-full animate-in duration-200" data-role={message.role}>
            <div
                className={`flex w-full items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
                {message.role === "assistant" && (
                    <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                        <Sparkles className="size-4" />
                    </div>
                )}

                <div
                    className={`flex flex-col ${
                        message.role === "user" ? "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]" : "w-full"
                    }`}
                >
                    {message.role === "user" ? (
                        <div
                            className="w-fit rounded-2xl px-3 py-2 text-white text-sm"
                            style={{ backgroundColor: "#006cff" }}
                        >
                            {message.content}
                        </div>
                    ) : (
                        <Streamdown
                            className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto"
                        >
                            {message.content}
                        </Streamdown>
                    )}
                </div>
            </div>
        </div>
    );
});

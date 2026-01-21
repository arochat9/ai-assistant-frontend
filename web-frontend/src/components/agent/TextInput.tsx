import { useRef } from "react";
import { Button } from "../ui/button";
import { Send, Plus } from "lucide-react";

interface TextInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onNewChat: () => void;
}

export function TextInput({ input, setInput, isLoading, onSubmit, onNewChat }: TextInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form onSubmit={onSubmit} className="relative w-full overflow-hidden rounded-xl border bg-background shadow-sm">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none border-0 bg-transparent px-4 py-3 pr-32 text-sm outline-none ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                style={
                    { maxHeight: "200px", minHeight: "44px", fieldSizing: "content" } as React.CSSProperties & {
                        fieldSizing?: string;
                    }
                }
            />
            <div className="absolute bottom-0 right-0 flex items-center gap-1 p-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onNewChat}
                    className="size-8"
                    title="New chat"
                >
                    <Plus className="size-4" />
                </Button>
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="size-8">
                    <Send className="size-4" />
                </Button>
            </div>
        </form>
    );
}

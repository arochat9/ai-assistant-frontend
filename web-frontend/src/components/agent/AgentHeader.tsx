import { Button } from "../ui/button";
import { MessageSquare, Phone } from "lucide-react";

type Mode = "text" | "voice";

interface AgentHeaderProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

export function AgentHeader({ mode, setMode }: AgentHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b bg-background p-4">
            <div>
                <h2 className="text-2xl font-bold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Chat with your AI about tasks</p>
            </div>
            <div className="flex gap-2">
                <Button variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => setMode("text")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Text
                </Button>
                <Button variant={mode === "voice" ? "default" : "outline"} size="sm" onClick={() => setMode("voice")}>
                    <Phone className="mr-2 h-4 w-4" />
                    Voice
                </Button>
            </div>
        </div>
    );
}

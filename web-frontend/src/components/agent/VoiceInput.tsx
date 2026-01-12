import { Button } from "../ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
    isListening: boolean;
    onToggle: () => void;
}

export function VoiceInput({ isListening, onToggle }: VoiceInputProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-background p-8 shadow-sm">
            <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={onToggle}
                className="h-16 w-16 rounded-full"
            >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <span className="text-sm text-muted-foreground">{isListening ? "Listening..." : "Tap to talk"}</span>
        </div>
    );
}

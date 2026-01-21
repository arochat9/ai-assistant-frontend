import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AgentHeader } from "../components/agent/AgentHeader";
import { AgentMessages } from "../components/agent/AgentMessages";
import { TextInput } from "../components/agent/TextInput";
import { VoiceInput } from "../components/agent/VoiceInput";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

type Mode = "text" | "voice";

export function AgentPage() {
    const [mode, setMode] = useState<Mode>("text");

    const { messages, input, setInput, handleSubmit, isLoading, append, setMessages } = useChat({
        api: "/api/agent/chat",
    });

    const { isListening, toggleListening } = useSpeechRecognition({
        onTranscript: (transcript) => {
            append({ role: "user", content: transcript });
        },
    });

    return (
        <div className="flex h-full flex-col bg-background">
            <AgentHeader mode={mode} setMode={setMode} />
            <AgentMessages messages={messages} />
            <div className="sticky bottom-0 mx-auto w-full max-w-3xl border-t-0 bg-background px-4 pb-4">
                {mode === "text" ? (
                    <TextInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={handleSubmit} onNewChat={() => setMessages([])} />
                ) : (
                    <VoiceInput isListening={isListening} onToggle={toggleListening} />
                )}
            </div>
        </div>
    );
}

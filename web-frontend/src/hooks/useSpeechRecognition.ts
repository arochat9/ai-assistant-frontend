import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionType {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
    onerror: () => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

interface UseSpeechRecognitionProps {
    onTranscript: (transcript: string) => void;
}

export function useSpeechRecognition({ onTranscript }: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;

        const SpeechRecognition =
            (
                window as {
                    SpeechRecognition?: new () => SpeechRecognitionType;
                    webkitSpeechRecognition?: new () => SpeechRecognitionType;
                }
            ).SpeechRecognition ||
            (
                window as {
                    SpeechRecognition?: new () => SpeechRecognitionType;
                    webkitSpeechRecognition?: new () => SpeechRecognitionType;
                }
            ).webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in your browser");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return {
        isListening,
        toggleListening,
        startListening,
        stopListening,
    };
}

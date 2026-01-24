import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from "react-native";
import { colors, spacing, fontSize } from "../theme";
import { useRealtimeAudio } from "../hooks/useRealtimeAudio";

const WS_URL = __DEV__ ? "ws://localhost:3000/api/realtime" : "wss://your-production-url.fly.dev/api/realtime";

type VoiceState = "connecting" | "idle" | "listening" | "processing" | "speaking";

interface VoiceModeProps {
    visible: boolean;
}

export function VoiceMode({ visible }: VoiceModeProps) {
    const [state, setState] = useState<VoiceState>("connecting");
    const [transcript, setTranscript] = useState("");
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const wsRef = useRef<WebSocket | null>(null);
    const busyRef = useRef(false);

    const onPlaybackComplete = useCallback(() => {
        busyRef.current = false;
        setState("idle");
        setTranscript("");
    }, []);

    const audio = useRealtimeAudio({ onPlaybackComplete });

    // Pulse animation
    useEffect(() => {
        if (state === "listening" || state === "speaking") {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ]),
            );
            pulse.start();
            return () => pulse.stop();
        }
        pulseAnim.setValue(1);
    }, [state, pulseAnim]);

    const handleMessage = useCallback(
        (data: { type: string; delta?: string; message?: string }) => {
            switch (data.type) {
                case "session_ready":
                    setState("idle");
                    break;
                case "response.audio_transcript.delta":
                    if (data.delta) setTranscript((prev) => prev + data.delta);
                    break;
                case "response.audio.delta":
                    if (data.delta) {
                        setState("speaking");
                        audio.enqueueAudio(data.delta);
                    }
                    break;
                case "response.audio.done":
                    audio.markStreamDone();
                    break;
                case "error":
                    console.error("[VoiceMode] Error:", data.message);
                    busyRef.current = false;
                    setState("idle");
                    break;
            }
        },
        [audio],
    );

    // Setup WebSocket on mount
    useEffect(() => {
        if (!visible) return;

        const setup = async () => {
            await audio.initAudioSession();
            setState("connecting");

            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            ws.onopen = () => console.log("[VoiceMode] Connected");
            ws.onmessage = (e) => {
                try {
                    handleMessage(JSON.parse(e.data));
                } catch {}
            };
            ws.onerror = () => setState("idle");
            ws.onclose = () => {
                wsRef.current = null;
            };
        };

        setup();
        return () => {
            audio.cleanup();
            wsRef.current?.close();
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleTap = useCallback(async () => {
        if (state === "connecting" || state === "processing") return;

        if (state === "idle" && !busyRef.current) {
            if (await audio.startRecording()) setState("listening");
        } else if (state === "listening") {
            const pcm16 = audio.stopRecording();
            if (pcm16 && wsRef.current?.readyState === WebSocket.OPEN) {
                setState("processing");
                busyRef.current = true;
                wsRef.current.send(JSON.stringify({ type: "audio", audio: pcm16 }));
                wsRef.current.send(JSON.stringify({ type: "commit_audio" }));
            } else {
                setState("idle");
            }
        } else if (state === "speaking") {
            audio.stopPlayback();
            busyRef.current = false;
            wsRef.current?.send(JSON.stringify({ type: "response.cancel" }));
            setState("idle");
            setTranscript("");
        }
    }, [state, audio]);

    const handleClose = useCallback(() => {
        audio.cleanup();
        wsRef.current?.close();
    }, [audio]);

    const stateText = {
        connecting: "Connecting...",
        listening: "Listening...",
        processing: "Thinking...",
        speaking: transcript || "...",
        idle: "",
    }[state];

    const stateColor = {
        listening: colors.primary,
        processing: colors.textSecondary,
        speaking: colors.success,
        connecting: colors.textMuted,
        idle: colors.textMuted,
    }[state];

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {state === "speaking" && transcript ? (
                <ScrollView style={styles.transcriptScroll} contentContainerStyle={styles.transcriptContent}>
                    <Text style={styles.transcriptText}>{transcript}</Text>
                </ScrollView>
            ) : (
                <View style={styles.spacer} />
            )}
            <View style={styles.orbSection}>
                <Text style={styles.stateText}>{state === "speaking" ? "Tap to stop" : stateText}</Text>
                <Pressable
                    onPress={handleTap}
                    style={styles.orbContainer}
                    disabled={state === "connecting" || state === "processing"}
                >
                    <Animated.View
                        style={[styles.orb, { backgroundColor: stateColor, transform: [{ scale: pulseAnim }] }]}
                    />
                    <View style={styles.orbInner} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    spacer: { flex: 1 },
    orbSection: {
        alignItems: "center",
        paddingBottom: spacing.xl * 2,
        paddingHorizontal: spacing.xl,
    },
    orbContainer: { width: 140, height: 140, justifyContent: "center", alignItems: "center", marginTop: spacing.lg },
    orb: { position: "absolute", width: 140, height: 140, borderRadius: 70, opacity: 0.3 },
    orbInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.surface,
        borderWidth: 3,
        borderColor: colors.border,
    },
    stateText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
        textAlign: "center",
    },
    transcriptScroll: {
        flex: 1,
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    transcriptContent: {
        paddingBottom: spacing.xl,
    },
    transcriptText: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: fontSize.md * 1.6,
    },
});

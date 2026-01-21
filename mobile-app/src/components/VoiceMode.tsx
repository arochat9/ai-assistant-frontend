import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Animated } from "react-native";
import { colors, spacing, fontSize } from "../theme";
import { useRealtimeAudio } from "../hooks/useRealtimeAudio";

const WS_URL = __DEV__ ? "ws://localhost:3000/api/realtime" : "wss://your-production-url.fly.dev/api/realtime";

type VoiceState = "connecting" | "idle" | "listening" | "processing" | "speaking";

interface VoiceModeProps {
    visible: boolean;
    onClose: () => void;
}

export function VoiceMode({ visible, onClose }: VoiceModeProps) {
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
        if (state === "connecting" || state === "processing" || busyRef.current) return;

        if (state === "idle") {
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
        onClose();
    }, [audio, onClose]);

    const stateText = {
        connecting: "Connecting...",
        listening: "Listening...",
        processing: "Thinking...",
        speaking: transcript || "...",
        idle: "Tap to speak",
    }[state];

    const stateColor = {
        listening: colors.primary,
        processing: colors.textSecondary,
        speaking: colors.success,
        connecting: colors.textMuted,
        idle: colors.textMuted,
    }[state];

    return (
        <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleClose}>
            <View style={styles.container}>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                    <Text style={styles.closeIcon}>✕</Text>
                </Pressable>

                <View style={styles.content}>
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
                    <Text style={styles.stateText} numberOfLines={3}>
                        {stateText}
                    </Text>
                    {state === "idle" && <Text style={styles.hint}>Tap to start talking</Text>}
                </View>

                {(state === "listening" || state === "speaking") && (
                    <Pressable style={styles.endButton} onPress={handleClose}>
                        <Text style={styles.endText}>End</Text>
                    </Pressable>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    closeButton: {
        position: "absolute",
        top: 60,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    closeIcon: { fontSize: 20, color: colors.text },
    content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
    orbContainer: { width: 180, height: 180, justifyContent: "center", alignItems: "center", marginBottom: spacing.xl },
    orb: { position: "absolute", width: 180, height: 180, borderRadius: 90, opacity: 0.3 },
    orbInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.surface,
        borderWidth: 3,
        borderColor: colors.border,
    },
    stateText: {
        fontSize: fontSize.lg,
        color: colors.text,
        textAlign: "center",
        marginBottom: spacing.sm,
        maxWidth: "80%",
    },
    hint: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },
    endButton: {
        position: "absolute",
        bottom: 60,
        alignSelf: "center",
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 24,
    },
    endText: { fontSize: fontSize.md, color: colors.text, fontWeight: "500" },
});

import { useRef, useCallback, useMemo } from "react";
import {
    AudioContext,
    AudioBufferQueueSourceNode,
    AudioRecorder,
    AudioManager,
} from "react-native-audio-api";

const SAMPLE_RATE = 24000;

// PCM16 base64 to Float32Array
function decodePcm16(pcm16Base64: string): Float32Array {
    const pcmBytes = atob(pcm16Base64);
    const numSamples = pcmBytes.length / 2;
    const float32Data = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        const low = pcmBytes.charCodeAt(i * 2);
        const high = pcmBytes.charCodeAt(i * 2 + 1);
        let sample = low | (high << 8);
        if (sample >= 0x8000) sample -= 0x10000;
        float32Data[i] = sample / 32768.0;
    }
    return float32Data;
}

// Float32Array to PCM16 base64
function encodePcm16(float32Data: Float32Array): string {
    const pcm16 = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

interface UseRealtimeAudioOptions {
    onPlaybackComplete: () => void;
}

export function useRealtimeAudio({ onPlaybackComplete }: UseRealtimeAudioOptions) {
    const audioContextRef = useRef<AudioContext | null>(null);
    const queueSourceRef = useRef<AudioBufferQueueSourceNode | null>(null);
    const recorderRef = useRef<AudioRecorder | null>(null);
    const chunksRef = useRef<number[][]>([]);
    
    const isPlayingRef = useRef(false);
    const streamDoneRef = useRef(false);
    const buffersEnqueued = useRef(0);
    const buffersPlayed = useRef(0);

    const getContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
        }
        return audioContextRef.current;
    }, []);

    const onEnded = useCallback(() => {
        buffersPlayed.current++;
        if (streamDoneRef.current && buffersPlayed.current >= buffersEnqueued.current) {
            isPlayingRef.current = false;
            streamDoneRef.current = false;
            buffersEnqueued.current = 0;
            buffersPlayed.current = 0;
            queueSourceRef.current = null;
            onPlaybackComplete();
        }
    }, [onPlaybackComplete]);

    const startPlayback = useCallback(() => {
        if (isPlayingRef.current) return;
        buffersEnqueued.current = 0;
        buffersPlayed.current = 0;
        
        const ctx = getContext();
        const source = ctx.createBufferQueueSource();
        source.connect(ctx.destination);
        source.onEnded = onEnded;
        source.start(ctx.currentTime);
        
        queueSourceRef.current = source;
        isPlayingRef.current = true;
    }, [getContext, onEnded]);

    const enqueueAudio = useCallback((pcm16Base64: string) => {
        if (!queueSourceRef.current) startPlayback();
        const ctx = audioContextRef.current;
        const source = queueSourceRef.current;
        if (!ctx || !source) return;

        const float32Data = decodePcm16(pcm16Base64);
        const buffer = ctx.createBuffer(1, float32Data.length, SAMPLE_RATE);
        buffer.copyToChannel(float32Data, 0, 0);
        source.enqueueBuffer(buffer);
        buffersEnqueued.current++;
    }, [startPlayback]);

    const markStreamDone = useCallback(() => {
        streamDoneRef.current = true;
    }, []);

    const stopPlayback = useCallback(() => {
        if (queueSourceRef.current) {
            try {
                queueSourceRef.current.stop();
                queueSourceRef.current.clearBuffers();
            } catch {}
            queueSourceRef.current = null;
        }
        isPlayingRef.current = false;
        buffersEnqueued.current = 0;
        buffersPlayed.current = 0;
    }, []);

    const startRecording = useCallback(async (): Promise<boolean> => {
        const permission = await AudioManager.requestRecordingPermissions();
        if (permission !== "Granted") return false;

        stopPlayback();
        chunksRef.current = [];

        if (!recorderRef.current) recorderRef.current = new AudioRecorder();
        
        recorderRef.current.onAudioReady(
            { sampleRate: SAMPLE_RATE, bufferLength: 2400, channelCount: 1 },
            ({ buffer }) => chunksRef.current.push(Array.from(buffer.getChannelData(0)))
        );

        const result = recorderRef.current.start();
        return result.status !== "error";
    }, [stopPlayback]);

    const stopRecording = useCallback((): string | null => {
        if (!recorderRef.current?.isRecording()) return null;
        
        recorderRef.current.clearOnAudioReady();
        recorderRef.current.stop();

        const totalSamples = chunksRef.current.reduce((sum, c) => sum + c.length, 0);
        if (totalSamples < SAMPLE_RATE * 0.1) return null; // Too short

        const allData = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of chunksRef.current) {
            allData.set(chunk, offset);
            offset += chunk.length;
        }
        chunksRef.current = [];
        return encodePcm16(allData);
    }, []);

    const cleanup = useCallback(() => {
        if (recorderRef.current?.isRecording()) recorderRef.current.stop();
        recorderRef.current = null;
        stopPlayback();
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch {}
            audioContextRef.current = null;
        }
        AudioManager.setAudioSessionActivity(false);
    }, [stopPlayback]);

    const initAudioSession = useCallback(async () => {
        AudioManager.setAudioSessionOptions({
            iosCategory: "playAndRecord",
            iosMode: "voiceChat",
            iosOptions: ["defaultToSpeaker", "allowBluetooth"],
        });
        await AudioManager.setAudioSessionActivity(true);
    }, []);

    // Return stable object reference
    return useMemo(() => ({
        enqueueAudio,
        markStreamDone,
        stopPlayback,
        startRecording,
        stopRecording,
        cleanup,
        initAudioSession,
    }), [enqueueAudio, markStreamDone, stopPlayback, startRecording, stopRecording, cleanup, initAudioSession]);
}

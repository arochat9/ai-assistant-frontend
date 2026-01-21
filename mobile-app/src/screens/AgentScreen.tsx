import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    NativeScrollEvent,
} from "react-native";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import Markdown from "react-native-markdown-display";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { agentApi, ChatMessage, ToolCall } from "../services/api";
import { VoiceMode } from "../components/VoiceMode";

interface DisplayMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    toolCalls: Map<string, ToolCall>;
    isStreaming?: boolean;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
    getTasks: "Fetching tasks",
    getTaskDetails: "Getting task details",
    createTask: "Creating task",
    updateTask: "Updating task",
};

function ToolCallBubble({ toolCall }: { toolCall: ToolCall }) {
    const displayName = TOOL_DISPLAY_NAMES[toolCall.toolName] || toolCall.toolName;
    const isComplete = toolCall.state === "result";
    const args = toolCall.args;
    const taskName = typeof args.taskName === "string" ? args.taskName : null;
    const status = typeof args.status === "string" ? args.status : null;
    const isRecurring = args.isRecurring === true;

    return (
        <View style={styles.toolBubble}>
            <View style={styles.toolHeader}>
                {isComplete ? (
                    <Text style={styles.toolIcon}>✓</Text>
                ) : (
                    <ActivityIndicator size="small" color={colors.primary} />
                )}
                <Text style={styles.toolName}>{displayName}</Text>
            </View>
            {toolCall.toolName === "createTask" && taskName && (
                <Text style={styles.toolDetail}>
                    {taskName}
                    {isRecurring && " (recurring)"}
                </Text>
            )}
            {toolCall.toolName === "updateTask" && (
                <Text style={styles.toolDetail}>
                    {taskName && `${taskName} `}
                    {status && `→ ${status}`}
                </Text>
            )}
        </View>
    );
}

export function AgentScreen() {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const isNearBottomRef = useRef(true);
    const [isListening, setIsListening] = useState(false);
    const [voiceModeVisible, setVoiceModeVisible] = useState(false);

    // Speech recognition events
    useSpeechRecognitionEvent("result", (event) => {
        const transcript = event.results[0]?.transcript;
        if (transcript) {
            setInputText(transcript);
        }
    });

    useSpeechRecognitionEvent("end", () => {
        setIsListening(false);
    });

    useSpeechRecognitionEvent("error", () => {
        setIsListening(false);
    });

    const toggleVoice = useCallback(async () => {
        if (isListening) {
            ExpoSpeechRecognitionModule.stop();
            setIsListening(false);
            return;
        }

        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
            return;
        }

        ExpoSpeechRecognitionModule.start({
            lang: "en-US",
            interimResults: true,
            continuous: false,
        });
        setIsListening(true);
    }, [isListening]);

    const handleScroll = useCallback((event: { nativeEvent: NativeScrollEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        isNearBottomRef.current = distanceFromBottom < 100;
    }, []);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isLoading) return;

        const userMessage: DisplayMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            toolCalls: new Map(),
        };

        const assistantId = (Date.now() + 1).toString();
        const assistantMessage: DisplayMessage = {
            id: assistantId,
            role: "assistant",
            content: "",
            toolCalls: new Map(),
            isStreaming: true,
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInputText("");
        setIsLoading(true);

        const chatHistory: ChatMessage[] = [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
        }));

        await agentApi.chatStream(chatHistory, {
            onText: (chunk) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: m.content + chunk } : m
                    )
                );
            },
            onToolCall: (toolCall) => {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== assistantId) return m;
                        const newToolCalls = new Map(m.toolCalls);
                        newToolCalls.set(toolCall.toolCallId, toolCall);
                        return { ...m, toolCalls: newToolCalls };
                    })
                );
            },
            onToolResult: (toolCallId, result) => {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== assistantId) return m;
                        const newToolCalls = new Map(m.toolCalls);
                        const existing = newToolCalls.get(toolCallId);
                        if (existing) {
                            newToolCalls.set(toolCallId, { ...existing, state: "result", result });
                        }
                        return { ...m, toolCalls: newToolCalls };
                    })
                );
            },
            onError: (error) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: `Error: ${error.message}`, isStreaming: false }
                            : m
                    )
                );
                setIsLoading(false);
            },
            onDone: () => {
                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
                );
                setIsLoading(false);
            },
        });
    }, [inputText, messages, isLoading]);

    const handleContentSizeChange = useCallback(() => {
        if (isNearBottomRef.current) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    }, []);

    const handleNewChat = useCallback(() => {
        setMessages([]);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Agent</Text>
                    <Text style={styles.subtitle}>AI Assistant</Text>
                </View>
                <View style={styles.headerButtons}>
                    <Pressable style={styles.headerButton} onPress={() => setVoiceModeVisible(true)}>
                        <Text style={styles.headerButtonIcon}>🎙</Text>
                    </Pressable>
                    {messages.length > 0 && (
                        <Pressable style={styles.headerButton} onPress={handleNewChat}>
                            <Text style={styles.headerButtonIcon}>✎</Text>
                        </Pressable>
                    )}
                </View>
            </View>

            <VoiceMode
                visible={voiceModeVisible}
                onClose={() => setVoiceModeVisible(false)}
            />

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={handleContentSizeChange}
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.length === 0 && !isLoading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>Hello!</Text>
                            <Text style={styles.emptySubtitle}>
                                Ask me to create tasks, check your schedule, or manage your to-dos.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <View key={message.id}>
                                    {message.role === "user" ? (
                                        <View style={styles.userBubble}>
                                            <Text style={styles.userText}>{message.content}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.assistantContainer}>
                                            {Array.from(message.toolCalls.values()).map((tc) => (
                                                <ToolCallBubble key={tc.toolCallId} toolCall={tc} />
                                            ))}
                                            {message.content ? (
                                                <Markdown style={markdownStyles}>{message.content}</Markdown>
                                            ) : message.isStreaming && message.toolCalls.size === 0 ? (
                                                <View style={styles.typingIndicator}>
                                                    <View style={styles.typingDot} />
                                                    <View style={styles.typingDot} />
                                                    <View style={styles.typingDot} />
                                                </View>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>

                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={isListening ? "Listening..." : "Message..."}
                            placeholderTextColor={isListening ? colors.primary : colors.textMuted}
                            multiline
                            maxLength={2000}
                        />
                        {inputText.trim() ? (
                            <Pressable
                                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={isLoading}
                            >
                                <Text style={[styles.sendIcon, isLoading && styles.sendIconDisabled]}>↑</Text>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={[styles.micButton, isListening && styles.micButtonActive]}
                                onPress={toggleVoice}
                            >
                                <Text style={[styles.micIcon, isListening && styles.micIconActive]}>🎙</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: "700",
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    headerButtonIcon: {
        fontSize: 18,
        color: colors.text,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: "600",
        color: colors.text,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        borderBottomRightRadius: 6,
        maxWidth: "80%",
        marginBottom: spacing.md,
    },
    userText: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 22,
    },
    assistantContainer: {
        alignSelf: "flex-start",
        maxWidth: "90%",
        marginBottom: spacing.md,
    },
    assistantText: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 24,
    },
    toolBubble: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    toolHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    toolIcon: {
        fontSize: fontSize.sm,
        color: colors.success,
        fontWeight: "600",
    },
    toolName: {
        fontSize: fontSize.sm,
        color: colors.text,
        fontWeight: "500",
    },
    toolDetail: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: 4,
    },
    typingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: spacing.sm,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textMuted,
    },
    inputWrapper: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        paddingLeft: spacing.md,
        paddingRight: 4,
        paddingVertical: 4,
        minHeight: 48,
    },
    input: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.text,
        maxHeight: 120,
        paddingVertical: Platform.OS === "ios" ? 10 : 8,
        paddingRight: spacing.sm,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.text,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Platform.OS === "ios" ? 2 : 0,
    },
    sendButtonDisabled: {
        backgroundColor: colors.surfaceElevated,
    },
    sendIcon: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.background,
        marginTop: -2,
    },
    sendIconDisabled: {
        color: colors.textMuted,
    },
    micButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceElevated,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Platform.OS === "ios" ? 2 : 0,
    },
    micButtonActive: {
        backgroundColor: colors.primary,
    },
    micIcon: {
        fontSize: 18,
    },
    micIconActive: {
        transform: [{ scale: 1.1 }],
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 24,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: spacing.sm,
    },
    heading1: {
        fontSize: fontSize.xl,
        fontWeight: "700",
        color: colors.text,
        marginBottom: spacing.sm,
    },
    heading2: {
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.text,
        marginBottom: spacing.xs,
    },
    heading3: {
        fontSize: fontSize.md,
        fontWeight: "600",
        color: colors.text,
        marginBottom: spacing.xs,
    },
    link: {
        color: colors.primary,
    },
    blockquote: {
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginVertical: spacing.sm,
    },
    code_inline: {
        backgroundColor: colors.surface,
        color: colors.text,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: fontSize.sm,
    },
    code_block: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: fontSize.sm,
    },
    fence: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: fontSize.sm,
        marginVertical: spacing.sm,
    },
    list_item: {
        marginBottom: spacing.xs,
    },
    bullet_list: {
        marginBottom: spacing.sm,
    },
    ordered_list: {
        marginBottom: spacing.sm,
    },
    strong: {
        fontWeight: "700",
    },
    em: {
        fontStyle: "italic",
    },
});

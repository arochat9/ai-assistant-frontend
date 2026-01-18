import React, { useState, useRef, useCallback } from "react";
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
} from "react-native";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { agentApi, ChatMessage } from "../services/api";

interface DisplayMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function AgentScreen() {
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isLoading) return;

        const userMessage: DisplayMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text,
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText("");
        setIsLoading(true);

        // Build chat history for API
        const chatHistory: ChatMessage[] = newMessages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const response = await agentApi.chat(chatHistory);

            const assistantMessage: DisplayMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: response || "I couldn't generate a response.",
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: DisplayMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, messages, isLoading]);

    const handleContentSizeChange = useCallback(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, []);

    const renderMessage = (message: DisplayMessage) => {
        const isUser = message.role === "user";

        return (
            <View
                key={message.id}
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                ]}
            >
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                    {message.content}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Agent</Text>
                <Text style={styles.subtitle}>AI Assistant</Text>
            </View>

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
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.length === 0 && !isLoading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>Start a conversation</Text>
                            <Text style={styles.emptySubtitle}>
                                Ask me to help manage your tasks, schedule events, or answer questions.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {messages.map(renderMessage)}
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={styles.loadingText}>Thinking...</Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={2000}
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <Pressable
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </Pressable>
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: "700" as const,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: "center" as const,
        lineHeight: 22,
    },
    messageBubble: {
        maxWidth: "85%",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    userBubble: {
        backgroundColor: colors.primary,
        alignSelf: "flex-end" as const,
        borderBottomRightRadius: borderRadius.sm,
    },
    assistantBubble: {
        backgroundColor: colors.surface,
        alignSelf: "flex-start" as const,
        borderBottomLeftRadius: borderRadius.sm,
    },
    messageText: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 22,
    },
    userMessageText: {
        color: colors.text,
    },
    loadingContainer: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        alignSelf: "flex-start" as const,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    loadingText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    inputContainer: {
        flexDirection: "row" as const,
        alignItems: "flex-end" as const,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    input: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.text,
        maxHeight: 100,
        marginRight: spacing.sm,
    },
    sendButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    sendButtonDisabled: {
        backgroundColor: colors.surface,
    },
    sendButtonText: {
        fontSize: fontSize.md,
        fontWeight: "600" as const,
        color: colors.text,
    },
});

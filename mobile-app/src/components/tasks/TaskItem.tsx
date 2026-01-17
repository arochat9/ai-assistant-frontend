import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { colors, spacing, fontSize, borderRadius } from "../../theme";
import { Task, TaskStatus } from "../../types";

interface TaskItemProps {
    task: Task;
    onPress: (task: Task) => void;
    onToggleStatus: (task: Task) => void;
}

export function TaskItem({ task, onPress, onToggleStatus }: TaskItemProps) {
    const swipeableRef = useRef<Swipeable>(null);
    const isCompleted = task.status === TaskStatus.CLOSED;

    const formatDate = (date?: Date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    };

    const getStatusColor = () => {
        switch (task.status) {
            case TaskStatus.CLOSED:
                return colors.statusClosed;
            case TaskStatus.BACKLOGGED:
                return colors.statusBacklogged;
            default:
                return colors.statusOpen;
        }
    };

    const handleComplete = () => {
        swipeableRef.current?.close();
        onToggleStatus(task);
    };

    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [0.5, 1],
            extrapolate: "clamp",
        });

        return (
            <Pressable onPress={handleComplete} style={styles.leftAction}>
                <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
                    <Text style={styles.actionIcon}>{isCompleted ? "↩" : "✓"}</Text>
                    <Text style={styles.actionText}>
                        {isCompleted ? "Reopen" : "Done"}
                    </Text>
                </Animated.View>
            </Pressable>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderLeftActions={renderLeftActions}
            leftThreshold={80}
            overshootLeft={false}
        >
            <Pressable
                style={({ pressed }) => [
                    styles.container,
                    pressed && styles.containerPressed,
                    isCompleted && styles.containerCompleted,
                ]}
                onPress={() => onPress(task)}
            >
                <View style={styles.content}>
                    <Text
                        style={[
                            styles.taskName,
                            isCompleted && styles.taskNameCompleted,
                        ]}
                        numberOfLines={2}
                    >
                        {task.taskName || "Untitled Task"}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={[styles.badge, { backgroundColor: getStatusColor() + "20" }]}>
                            <Text style={[styles.badgeText, { color: getStatusColor() }]}>
                                {task.subType}
                            </Text>
                        </View>

                        {task.source && (
                            <Text style={styles.source}>{task.source}</Text>
                        )}

                        {task.taskDueTime && (
                            <Text style={styles.dueDate}>
                                Due {formatDate(task.taskDueTime)}
                            </Text>
                        )}

                        {task.plannedFor && (
                            <Text style={styles.plannedFor}>
                                {task.plannedFor}
                            </Text>
                        )}
                    </View>
                </View>

                <Text style={styles.chevron}>›</Text>
            </Pressable>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    containerPressed: {
        backgroundColor: colors.surface,
    },
    containerCompleted: {
        opacity: 0.6,
    },
    content: {
        flex: 1,
    },
    taskName: {
        fontSize: fontSize.md,
        fontWeight: "500" as const,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    taskNameCompleted: {
        textDecorationLine: "line-through" as const,
        color: colors.textMuted,
    },
    metaRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        flexWrap: "wrap" as const,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginRight: spacing.sm,
    },
    badgeText: {
        fontSize: fontSize.xs,
        fontWeight: "500" as const,
    },
    source: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginRight: spacing.sm,
    },
    dueDate: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginRight: spacing.sm,
    },
    plannedFor: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    chevron: {
        fontSize: fontSize.xl,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
    leftAction: {
        backgroundColor: colors.statusClosed,
        justifyContent: "center" as const,
        alignItems: "flex-end" as const,
        paddingRight: spacing.lg,
        width: 100,
    },
    actionContent: {
        alignItems: "center" as const,
    },
    actionIcon: {
        fontSize: 24,
        color: colors.text,
        marginBottom: 2,
    },
    actionText: {
        fontSize: fontSize.xs,
        color: colors.text,
        fontWeight: "600" as const,
    },
});

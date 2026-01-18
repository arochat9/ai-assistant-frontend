import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { Task, TaskStatus } from "../types";
import { useTaskMutations } from "../hooks/useTaskMutations";
import type { TasksStackParamList } from "../navigation/types";

type TaskDetailRouteParams = {
    TaskDetail: {
        task: Task;
    };
};

export function TaskDetailScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
    const route = useRoute<RouteProp<TaskDetailRouteParams, "TaskDetail">>();
    const task = route.params.task;

    const { updateMutation } = useTaskMutations({
        onUpdateSuccess: () => navigation.goBack(),
    });

    const isCompleted = task.status === TaskStatus.CLOSED;

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

    const formatDateTime = (date?: Date | string) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateOnly = (date?: Date | string) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleToggleStatus = () => {
        const newStatus = task.status === TaskStatus.CLOSED ? TaskStatus.OPEN : TaskStatus.CLOSED;
        updateMutation.mutate({
            taskId: task.taskId,
            taskOrEvent: task.taskOrEvent,
            status: newStatus,
            subType: task.subType,
        });
    };

    const handleEdit = () => {
        navigation.navigate("TaskForm", { task });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Pressable onPress={handleEdit} hitSlop={8}>
                    <Text style={styles.editText}>Edit</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Task Name */}
                <Text style={[styles.taskName, isCompleted && styles.taskNameCompleted]}>
                    {task.taskName || "Untitled Task"}
                </Text>

                {/* Status Badges */}
                <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.statusBadgeText}>{task.status}</Text>
                    </View>
                    <View style={styles.pillBadge}>
                        <Text style={styles.pillBadgeText}>{task.subType}</Text>
                    </View>
                    {task.isRecurring && (
                        <View style={styles.pillBadge}>
                            <Text style={styles.pillBadgeText}>Recurring</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {task.taskContext && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Description</Text>
                        <Text style={styles.text}>{task.taskContext}</Text>
                    </View>
                )}

                {/* Notes */}
                {task.userNotes && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Notes</Text>
                        <Text style={styles.text}>{task.userNotes}</Text>
                    </View>
                )}

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    {task.plannedFor && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Planned For</Text>
                            <Text style={styles.infoValue}>{task.plannedFor}</Text>
                        </View>
                    )}
                    {task.source && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Source</Text>
                            <Text style={styles.infoValue}>{task.source}</Text>
                        </View>
                    )}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Due</Text>
                        <Text style={styles.infoValue}>{formatDateOnly(task.taskDueTime)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Created</Text>
                        <Text style={styles.infoValue}>{formatDateTime(task.createdAt)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Updated</Text>
                        <Text style={styles.infoValue}>{formatDateTime(task.updatedAt)}</Text>
                    </View>
                    {task.completedAt && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Completed</Text>
                            <Text style={styles.infoValue}>{formatDateTime(task.completedAt)}</Text>
                        </View>
                    )}
                </View>

                {/* Chats */}
                {task.chats && task.chats.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Chat(s)</Text>
                        <Text style={styles.text}>{task.chats.join(", ")}</Text>
                    </View>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Tags</Text>
                        <View style={styles.tagsRow}>
                            {task.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Event Times */}
                {(task.eventStartTime || task.eventEndTime) && (
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Event Start</Text>
                            <Text style={styles.infoValue}>{formatDateTime(task.eventStartTime)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Event End</Text>
                            <Text style={styles.infoValue}>{formatDateTime(task.eventEndTime)}</Text>
                        </View>
                        {task.eventApprovalStatus && (
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Approval</Text>
                                <Text style={styles.infoValue}>{task.eventApprovalStatus}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.actionButton,
                        isCompleted ? styles.actionButtonReopen : styles.actionButtonComplete,
                        pressed && styles.actionButtonPressed,
                    ]}
                    onPress={handleToggleStatus}
                >
                    <Text style={styles.actionButtonText}>
                        {isCompleted ? "Reopen Task" : "Mark Complete"}
                    </Text>
                </Pressable>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: "500" as const,
    },
    editText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: "600" as const,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    taskName: {
        fontSize: 24,
        fontWeight: "700" as const,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    taskNameCompleted: {
        textDecorationLine: "line-through" as const,
        color: colors.textMuted,
    },
    badgesRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        marginBottom: spacing.lg,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        marginRight: spacing.xs,
    },
    statusBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: "600" as const,
        color: colors.text,
    },
    pillBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        marginRight: spacing.xs,
    },
    pillBadgeText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginBottom: 2,
    },
    text: {
        fontSize: fontSize.md,
        color: colors.text,
        lineHeight: 22,
    },
    infoGrid: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        marginBottom: spacing.md,
    },
    infoItem: {
        width: "50%" as const,
        marginBottom: spacing.sm,
    },
    infoLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    infoValue: {
        fontSize: fontSize.sm,
        color: colors.text,
    },
    tagsRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
    },
    tag: {
        backgroundColor: colors.primary + "20",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    tagText: {
        fontSize: fontSize.xs,
        color: colors.primary,
    },
    actionButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: "center" as const,
    },
    actionButtonComplete: {
        backgroundColor: colors.statusClosed,
    },
    actionButtonReopen: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionButtonPressed: {
        opacity: 0.8,
    },
    actionButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: "600" as const,
    },
    bottomPadding: {
        height: spacing.xl,
    },
});

import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tasksApi } from "../services/api";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { BottomSheet } from "../components/BottomSheet";
import { BottomSheetOption } from "../components/BottomSheetOption";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { Task, TaskStatus, TaskOrEvent, PlannedFor, Source } from "../types";

type PlannerSection = {
    key: string;
    title: string;
    plannedFor?: PlannedFor;
    isRecurring?: boolean;
    isUnplanned?: boolean;
    tasks: Task[];
};

export function WorkPlannerScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showMoveModal, setShowMoveModal] = useState(false);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksApi.getTasks({ taskOrEvent: TaskOrEvent.TASK }),
    });

    const { updateMutation, createMutation } = useTaskMutations({});

    const sections: PlannerSection[] = useMemo(() => {
        if (!data?.tasks) return [];

        const todayTasks = data.tasks.filter(
            (t) => t.plannedFor === PlannedFor.TODAY || t.plannedFor === PlannedFor.TODAY_STRETCH_GOAL,
        );
        const tomorrowTasks = data.tasks.filter(
            (t) => t.plannedFor === PlannedFor.TOMORROW || t.plannedFor === PlannedFor.TOMORROW_STRETCH_GOAL,
        );
        const weekTasks = data.tasks.filter(
            (t) => t.plannedFor === PlannedFor.THIS_WEEK || t.plannedFor === PlannedFor.THIS_WEEK_STRETCH_GOAL,
        );
        const recurringTasks = data.tasks.filter((t) => t.isRecurring && t.status === TaskStatus.OPEN);
        const unplannedTasks = data.tasks.filter((t) => !t.plannedFor && !t.isRecurring);

        return [
            { key: "today", title: "Today", plannedFor: PlannedFor.TODAY, tasks: todayTasks },
            { key: "tomorrow", title: "Tomorrow", plannedFor: PlannedFor.TOMORROW, tasks: tomorrowTasks },
            { key: "week", title: "This Week", plannedFor: PlannedFor.THIS_WEEK, tasks: weekTasks },
            { key: "recurring", title: "Recurring", isRecurring: true, tasks: recurringTasks },
            { key: "unplanned", title: "Unplanned", isUnplanned: true, tasks: unplannedTasks },
        ];
    }, [data?.tasks]);

    const handleCreateTask = useCallback(
        (plannedFor?: PlannedFor, isRecurring?: boolean) => {
            navigation.navigate("TaskForm", { defaultPlannedFor: plannedFor, defaultIsRecurring: isRecurring });
        },
        [navigation],
    );

    const handleTaskPress = useCallback(
        (task: Task) => {
            navigation.navigate("TaskDetail", { task });
        },
        [navigation],
    );

    const handleMoveTask = useCallback((task: Task) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedTask(task);
        setShowMoveModal(true);
    }, []);

    const handleToggleStatus = useCallback(
        (task: Task) => {
            const newStatus = task.status === TaskStatus.CLOSED ? TaskStatus.OPEN : TaskStatus.CLOSED;
            updateMutation.mutate({
                taskId: task.taskId,
                taskOrEvent: task.taskOrEvent,
                status: newStatus,
                subType: task.subType,
            });
        },
        [updateMutation],
    );

    const handleMoveTo = useCallback(
        (plannedFor?: PlannedFor) => {
            if (!selectedTask) return;

            // Close modal immediately for instant feedback
            setShowMoveModal(false);
            const taskToMove = selectedTask;
            setSelectedTask(null);

            // Trigger mutation (optimistic update happens in onMutate)
            if (taskToMove.isRecurring) {
                createMutation.mutate({
                    taskName: taskToMove.taskName,
                    status: TaskStatus.OPEN,
                    subType: taskToMove.subType,
                    taskOrEvent: TaskOrEvent.TASK,
                    plannedFor,
                    userNotes: taskToMove.userNotes,
                    isRecurring: false,
                    source: Source.USER,
                });
            } else {
                updateMutation.mutate({
                    taskId: taskToMove.taskId,
                    taskOrEvent: taskToMove.taskOrEvent,
                    status: taskToMove.status,
                    subType: taskToMove.subType,
                    plannedFor,
                });
            }
        },
        [selectedTask, updateMutation, createMutation],
    );

    const renderTask = (task: Task, section: PlannerSection) => {
        const isCompleted = task.status === TaskStatus.CLOSED;

        return (
            <View key={task.taskId} style={styles.taskRow}>
                <Pressable style={styles.checkbox} onPress={() => handleToggleStatus(task)}>
                    <View style={[styles.checkboxInner, isCompleted && styles.checkboxChecked]}>
                        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                </Pressable>

                <Pressable
                    style={styles.taskContent}
                    onPress={() => handleTaskPress(task)}
                    onLongPress={() => handleMoveTask(task)}
                >
                    <Text style={[styles.taskName, isCompleted && styles.taskNameCompleted]} numberOfLines={2}>
                        {task.taskName || "Untitled"}
                    </Text>
                    {((task.chats && task.chats.length > 0) || (task.plannedFor && task.plannedFor.includes("Stretch"))) && (
                        <View style={styles.tagsRow}>
                            {task.plannedFor && task.plannedFor.includes("Stretch") && (
                                <View style={styles.stretchTag}>
                                    <Text style={styles.stretchTagText}>Stretch</Text>
                                </View>
                            )}
                            {task.chats?.map((chat, idx) => (
                                <View key={idx} style={styles.chatTag}>
                                    <Text style={styles.chatTagText}>{chat}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </Pressable>

                <Pressable style={styles.moveButton} onPress={() => handleMoveTask(task)} hitSlop={8}>
                    <Text style={styles.moveButtonText}>{section.isRecurring ? "+" : "→"}</Text>
                </Pressable>
            </View>
        );
    };

    const renderSection = (section: PlannerSection) => {
        const openTasks = section.tasks.filter((t) => t.status !== TaskStatus.CLOSED);
        const closedTasks = section.tasks.filter((t) => t.status === TaskStatus.CLOSED);

        return (
            <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.sectionHeaderRight}>
                        <Text style={styles.taskCount}>{openTasks.length}</Text>
                        <Pressable
                            style={styles.addButton}
                            onPress={() => handleCreateTask(section.plannedFor, section.isRecurring)}
                            hitSlop={8}
                        >
                            <Text style={styles.addButtonText}>+</Text>
                        </Pressable>
                    </View>
                </View>

                {section.tasks.length === 0 ? (
                    <Text style={styles.emptyText}>No tasks</Text>
                ) : (
                    <>
                        {openTasks.map((task) => renderTask(task, section))}
                        {closedTasks.length > 0 && (
                            <View style={styles.completedSection}>
                                <Text style={styles.completedLabel}>Completed ({closedTasks.length})</Text>
                                {closedTasks.map((task) => renderTask(task, section))}
                            </View>
                        )}
                    </>
                )}
            </View>
        );
    };

    const renderMoveSheet = () => (
        <BottomSheet
            visible={showMoveModal}
            onClose={() => setShowMoveModal(false)}
            title={selectedTask?.isRecurring ? "Create Task For" : "Move To"}
        >
            <BottomSheetOption
                label="Today"
                onPress={() => handleMoveTo(PlannedFor.TODAY)}
                selected={selectedTask?.plannedFor === PlannedFor.TODAY}
            />
            <BottomSheetOption
                label="Today (Stretch)"
                onPress={() => handleMoveTo(PlannedFor.TODAY_STRETCH_GOAL)}
                selected={selectedTask?.plannedFor === PlannedFor.TODAY_STRETCH_GOAL}
            />
            <BottomSheetOption
                label="Tomorrow"
                onPress={() => handleMoveTo(PlannedFor.TOMORROW)}
                selected={selectedTask?.plannedFor === PlannedFor.TOMORROW}
            />
            <BottomSheetOption
                label="Tomorrow (Stretch)"
                onPress={() => handleMoveTo(PlannedFor.TOMORROW_STRETCH_GOAL)}
                selected={selectedTask?.plannedFor === PlannedFor.TOMORROW_STRETCH_GOAL}
            />
            <BottomSheetOption
                label="This Week"
                onPress={() => handleMoveTo(PlannedFor.THIS_WEEK)}
                selected={selectedTask?.plannedFor === PlannedFor.THIS_WEEK}
            />
            <BottomSheetOption
                label="This Week (Stretch)"
                onPress={() => handleMoveTo(PlannedFor.THIS_WEEK_STRETCH_GOAL)}
                selected={selectedTask?.plannedFor === PlannedFor.THIS_WEEK_STRETCH_GOAL}
            />
            {!selectedTask?.isRecurring && (
                <BottomSheetOption
                    label="Unplanned"
                    onPress={() => handleMoveTo(undefined)}
                    selected={!selectedTask?.plannedFor}
                />
            )}
        </BottomSheet>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Planner</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Planner</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load tasks</Text>
                    <Pressable style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Planner</Text>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                }
            >
                {sections.map(renderSection)}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {renderMoveSheet()}
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
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
    },
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    errorText: {
        color: colors.error,
        marginBottom: spacing.md,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: colors.text,
        fontWeight: "500" as const,
    },
    section: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    sectionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: "600" as const,
        color: colors.text,
    },
    sectionHeaderRight: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },
    taskCount: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginRight: spacing.sm,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    addButtonText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        marginTop: -2,
    },
    emptyText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontStyle: "italic" as const,
    },
    taskRow: {
        flexDirection: "row" as const,
        alignItems: "flex-start" as const,
        paddingVertical: spacing.sm,
    },
    checkbox: {
        marginRight: spacing.sm,
    },
    checkboxInner: {
        width: 22,
        height: 22,
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    checkboxChecked: {
        backgroundColor: colors.statusClosed,
        borderColor: colors.statusClosed,
    },
    checkmark: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600" as const,
    },
    taskContent: {
        flex: 1,
    },
    taskName: {
        fontSize: fontSize.md,
        color: colors.text,
    },
    taskNameCompleted: {
        textDecorationLine: "line-through" as const,
        color: colors.textMuted,
    },
    tagsRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        marginTop: spacing.xs,
    },
    stretchTag: {
        backgroundColor: colors.primary + "20",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginRight: spacing.xs,
    },
    stretchTagText: {
        fontSize: fontSize.xs,
        color: colors.primary,
    },
    chatTag: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginRight: spacing.xs,
    },
    chatTagText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    moveButton: {
        width: 32,
        height: 32,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    moveButtonText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
    },
    completedSection: {
        marginTop: spacing.sm,
        opacity: 0.6,
    },
    completedLabel: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

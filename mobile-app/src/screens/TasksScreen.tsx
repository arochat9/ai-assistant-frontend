import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Pressable,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "../services/api";
import { TaskItem } from "../components/tasks/TaskItem";
import { BottomSheet } from "../components/BottomSheet";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { Task, TaskStatus, TaskOrEvent, TaskFilters, getTaskStatusValues, getSubTypeValues } from "../types";
import type { TasksStackParamList } from "../navigation/types";

const DEFAULT_FILTERS: TaskFilters = { isRecurring: false };

export function TasksScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
    const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
    const [pendingFilters, setPendingFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["tasks", filters],
        queryFn: () => tasksApi.getTasks({ ...filters, taskOrEvent: TaskOrEvent.TASK }),
    });

    // Sort tasks by createdAt descending (newest first)
    const sortedTasks = useMemo(() => {
        if (!data?.tasks) return [];
        return [...data.tasks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [data?.tasks]);

    const { updateMutation } = useTaskMutations({});

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.status) count++;
        if (filters.subType) count++;
        return count;
    }, [filters]);

    const pendingFilterCount = useMemo(() => {
        let count = 0;
        if (pendingFilters.status) count++;
        if (pendingFilters.subType) count++;
        return count;
    }, [pendingFilters]);

    const handleTaskPress = useCallback((task: Task) => {
        navigation.navigate("TaskDetail", { task });
    }, [navigation]);

    const handleCreateTask = useCallback(() => {
        navigation.navigate("TaskForm", {});
    }, [navigation]);

    const handleToggleStatus = useCallback((task: Task) => {
        const newStatus = task.status === TaskStatus.CLOSED ? TaskStatus.OPEN : TaskStatus.CLOSED;
        updateMutation.mutate({
            taskId: task.taskId,
            taskOrEvent: task.taskOrEvent,
            status: newStatus,
            subType: task.subType,
        });
    }, [updateMutation]);

    const handleOpenFilters = useCallback(() => {
        setPendingFilters(filters);
        setIsFilterModalVisible(true);
    }, [filters]);

    const handleFilterChange = useCallback((key: keyof TaskFilters, value: string | undefined) => {
        setPendingFilters((prev) => ({ ...prev, [key]: value || undefined }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setPendingFilters(DEFAULT_FILTERS);
    }, []);

    const handleApplyFilters = useCallback(() => {
        setFilters(pendingFilters);
        setIsFilterModalVisible(false);
    }, [pendingFilters]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>
                Tap the + button to create your first task
            </Text>
        </View>
    );

    const renderFilterModal = () => (
        <BottomSheet
            visible={isFilterModalVisible}
            onClose={() => setIsFilterModalVisible(false)}
            title="Filters"
        >
            {pendingFilterCount > 0 && (
                <Pressable onPress={handleClearFilters} style={styles.clearAllButton}>
                    <Text style={styles.clearAllText}>Clear all</Text>
                </Pressable>
            )}

            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterOptions}>
                    <Pressable
                        style={[styles.filterOption, !pendingFilters.status && styles.filterOptionActive]}
                        onPress={() => handleFilterChange("status", undefined)}
                    >
                        <Text style={[styles.filterOptionText, !pendingFilters.status && styles.filterOptionTextActive]}>All</Text>
                    </Pressable>
                    {getTaskStatusValues().map((status) => (
                        <Pressable
                            key={status}
                            style={[styles.filterOption, pendingFilters.status === status && styles.filterOptionActive]}
                            onPress={() => handleFilterChange("status", status)}
                        >
                            <Text style={[styles.filterOptionText, pendingFilters.status === status && styles.filterOptionTextActive]}>{status}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Type</Text>
                <View style={styles.filterOptions}>
                    <Pressable
                        style={[styles.filterOption, !pendingFilters.subType && styles.filterOptionActive]}
                        onPress={() => handleFilterChange("subType", undefined)}
                    >
                        <Text style={[styles.filterOptionText, !pendingFilters.subType && styles.filterOptionTextActive]}>All</Text>
                    </Pressable>
                    {getSubTypeValues().map((subType) => (
                        <Pressable
                            key={subType}
                            style={[styles.filterOption, pendingFilters.subType === subType && styles.filterOptionActive]}
                            onPress={() => handleFilterChange("subType", subType)}
                        >
                            <Text style={[styles.filterOptionText, pendingFilters.subType === subType && styles.filterOptionTextActive]}>{subType}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <Pressable
                style={styles.filterDoneButton}
                onPress={handleApplyFilters}
            >
                <Text style={styles.filterDoneButtonText}>Done</Text>
            </Pressable>
        </BottomSheet>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Tasks</Text>
            <View style={styles.headerRight}>
                <Pressable
                    style={({ pressed }) => [
                        styles.filterButton,
                        pressed && styles.filterButtonPressed,
                        activeFilterCount > 0 && styles.filterButtonActive,
                    ]}
                    onPress={handleOpenFilters}
                >
                    <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
                        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    </Text>
                </Pressable>
                <Pressable
                    style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                    ]}
                    onPress={handleCreateTask}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </Pressable>
            </View>
        </View>
    );

    if (isLoading && !data) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading tasks...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>Failed to load tasks</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>
                    <Pressable style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <FlatList
                data={sortedTasks}
                keyExtractor={(item) => item.taskId}
                renderItem={({ item }) => (
                    <TaskItem
                        task={item}
                        onPress={handleTaskPress}
                        onToggleStatus={handleToggleStatus}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
            {renderFilterModal()}
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
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerRight: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
    },
    filterButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        marginRight: spacing.sm,
    },
    filterButtonPressed: {
        backgroundColor: colors.surfaceElevated,
    },
    filterButtonActive: {
        backgroundColor: colors.primary + "30",
    },
    filterButtonText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    filterButtonTextActive: {
        color: colors.primary,
        fontWeight: "500" as const,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    addButtonPressed: {
        backgroundColor: colors.primaryDark,
    },
    addButtonText: {
        fontSize: fontSize.lg,
        color: colors.text,
        fontWeight: "300" as const,
        marginTop: -1,
    },
    listContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: spacing.xl,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    errorTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    errorMessage: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        textAlign: "center" as const,
        marginBottom: spacing.lg,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: "500" as const,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: fontSize.xl,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: "center" as const,
    },
    // Filter styles
    clearAllButton: {
        alignSelf: "flex-end" as const,
        marginBottom: spacing.md,
        marginTop: -spacing.sm,
    },
    clearAllText: {
        fontSize: fontSize.sm,
        color: colors.error,
    },
    filterSection: {
        marginBottom: spacing.lg,
    },
    filterLabel: {
        fontSize: fontSize.sm,
        fontWeight: "500" as const,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    filterOptions: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
    },
    filterOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    filterOptionActive: {
        backgroundColor: colors.primary,
    },
    filterOptionText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    filterOptionTextActive: {
        color: colors.text,
        fontWeight: "500" as const,
    },
    filterDoneButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: "center" as const,
        marginTop: spacing.md,
    },
    filterDoneButtonText: {
        color: colors.text,
        fontSize: fontSize.md,
        fontWeight: "600" as const,
    },
});

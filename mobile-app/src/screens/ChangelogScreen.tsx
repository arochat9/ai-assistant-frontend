import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tasksApi } from "../services/api";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import type { TaskChangelog } from "../types";

export function ChangelogScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["changelogs"],
        queryFn: () => tasksApi.getTaskChangelogs({}),
    });

    const changelogs = data?.changelogs ?? [];

    // Group changes by snapshotId and sort by timestamp
    const sortedGroups = useMemo(() => {
        const grouped = changelogs.reduce(
            (groups, change) => {
                const key = change.changelogId.split("-").slice(0, -1).join("-"); // Group by task snapshot
                if (!groups[key]) groups[key] = [];
                groups[key].push(change);
                return groups;
            },
            {} as Record<string, TaskChangelog[]>,
        );

        return Object.values(grouped).sort((a, b) => {
            const timeA = new Date(a[0].timestamp).getTime();
            const timeB = new Date(b[0].timestamp).getTime();
            return timeB - timeA;
        });
    }, [changelogs]);

    const handleRowPress = async (taskId: string) => {
        try {
            const response = await tasksApi.getTaskById(taskId);
            navigation.navigate("Tasks", {
                screen: "TaskDetail",
                params: { task: response.task },
            });
        } catch (error) {
            console.error("Failed to fetch task:", error);
        }
    };

    const formatTimestamp = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return "—";
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Changelog</Text>
                <Text style={styles.subtitle}>
                    {changelogs.length} {changelogs.length === 1 ? "change" : "changes"}
                </Text>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : changelogs.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No changes recorded yet</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                    }
                >
                    {sortedGroups.map((group) => {
                        const firstChange = group[0];
                        return (
                            <Pressable
                                key={firstChange.changelogId}
                                style={styles.changeRow}
                                onPress={() => handleRowPress(firstChange.taskId)}
                            >
                                <View style={styles.changeHeader}>
                                    <Text style={styles.timestamp}>{formatTimestamp(firstChange.timestamp)}</Text>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{firstChange.updatedBy || "Unknown"}</Text>
                                    </View>
                                </View>
                                <View style={styles.changes}>
                                    {group.map((change) => (
                                        <View key={change.changelogId} style={styles.changeItem}>
                                            <Text style={styles.fieldName}>{change.fieldName}: </Text>
                                            {change.oldValue && (
                                                <Text style={styles.oldValue}>{formatValue(change.oldValue)}</Text>
                                            )}
                                            <Text style={styles.arrow}> → </Text>
                                            <Text style={styles.newValue}>{formatValue(change.newValue)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Pressable>
                        );
                    })}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}
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
        fontSize: fontSize.lg,
        fontWeight: "600",
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    changeRow: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    changeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    timestamp: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    badge: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    badgeText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    changes: {
        gap: spacing.xs,
    },
    changeItem: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
    },
    fieldName: {
        fontSize: fontSize.sm,
        fontWeight: "600",
        color: colors.text,
    },
    oldValue: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        textDecorationLine: "line-through",
    },
    arrow: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    newValue: {
        fontSize: fontSize.sm,
        fontWeight: "500",
        color: colors.text,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import {
    Task,
    TaskStatus,
    SubType,
    TaskOrEvent,
    PlannedFor,
    Source,
    CreateTaskInput,
    UpdateTaskInput,
    getTaskStatusValues,
    getSubTypeValues,
    getPlannedForValues,
} from "../types";

type TaskFormRouteParams = {
    TaskForm: {
        task?: Task;
        defaultPlannedFor?: PlannedFor;
        defaultIsRecurring?: boolean;
    };
};

export function TaskFormScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<TaskFormRouteParams, "TaskForm">>();
    const task = route.params?.task;
    const defaultPlannedFor = route.params?.defaultPlannedFor;
    const defaultIsRecurring = route.params?.defaultIsRecurring;
    const isEditing = !!task;

    const [taskName, setTaskName] = useState("");
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.OPEN);
    const [subType, setSubType] = useState<SubType>(SubType.ERRAND);
    const [plannedFor, setPlannedFor] = useState<PlannedFor | undefined>(defaultPlannedFor);
    const [isRecurring, setIsRecurring] = useState(defaultIsRecurring ?? false);
    const [userNotes, setUserNotes] = useState("");

    const { createMutation, updateMutation } = useTaskMutations({
        onCreateSuccess: () => navigation.goBack(),
        onUpdateSuccess: () => navigation.goBack(),
    });

    useEffect(() => {
        if (task) {
            setTaskName(task.taskName || "");
            setStatus(task.status);
            setSubType(task.subType);
            setPlannedFor(task.plannedFor);
            setIsRecurring(task.isRecurring ?? false);
            setUserNotes(task.userNotes || "");
        }
    }, [task]);

    const handleSave = useCallback(() => {
        if (isEditing && task) {
            const updateData: UpdateTaskInput = {
                taskId: task.taskId,
                taskName,
                status,
                subType,
                taskOrEvent: TaskOrEvent.TASK,
                plannedFor,
                userNotes: userNotes || undefined,
            };
            updateMutation.mutate(updateData);
        } else {
            const createData: CreateTaskInput = {
                taskName,
                status,
                subType,
                taskOrEvent: TaskOrEvent.TASK,
                plannedFor,
                userNotes: userNotes || undefined,
                isRecurring,
                source: Source.USER,
            };
            createMutation.mutate(createData);
        }
    }, [task, isEditing, taskName, status, subType, plannedFor, isRecurring, userNotes, createMutation, updateMutation]);

    const renderOptionGroup = (
        label: string,
        options: string[],
        selectedValue: string | undefined,
        onSelect: (value: string | undefined) => void,
        allowNone: boolean = false
    ) => (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.optionsRow}>
                {allowNone && (
                    <Pressable
                        style={[styles.option, !selectedValue && styles.optionActive]}
                        onPress={() => onSelect(undefined)}
                    >
                        <Text style={[styles.optionText, !selectedValue && styles.optionTextActive]}>None</Text>
                    </Pressable>
                )}
                {options.map((opt) => (
                    <Pressable
                        key={opt}
                        style={[styles.option, selectedValue === opt && styles.optionActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.optionText, selectedValue === opt && styles.optionTextActive]}>{opt}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>{isEditing ? "Edit Task" : "New Task"}</Text>
                    <Pressable onPress={handleSave}>
                        <Text style={styles.saveText}>Save</Text>
                    </Pressable>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Task Name</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={taskName}
                            onChangeText={setTaskName}
                            placeholder="Enter task name..."
                            placeholderTextColor={colors.textMuted}
                            autoFocus={!isEditing}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {renderOptionGroup("Status", getTaskStatusValues(), status, (v) => setStatus(v as TaskStatus))}
                    {renderOptionGroup("Type", getSubTypeValues(), subType, (v) => setSubType(v as SubType))}
                    {renderOptionGroup("Planned For", getPlannedForValues(), plannedFor, (v) => setPlannedFor(v as PlannedFor | undefined), true)}

                    <View style={styles.fieldGroup}>
                        <Pressable
                            style={styles.toggleRow}
                            onPress={() => setIsRecurring(!isRecurring)}
                        >
                            <Text style={styles.fieldLabel}>Recurring Task</Text>
                            <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
                                <View style={[styles.toggleKnob, isRecurring && styles.toggleKnobActive]} />
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Notes</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={userNotes}
                            onChangeText={setUserNotes}
                            placeholder="Add notes..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
    },
    cancelText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    saveText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: "600" as const,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    fieldGroup: {
        marginBottom: spacing.lg,
    },
    fieldLabel: {
        fontSize: fontSize.sm,
        fontWeight: "500" as const,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    textInput: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textArea: {
        minHeight: 100,
        paddingTop: spacing.md,
    },
    optionsRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
    },
    option: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    optionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    optionText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    optionTextActive: {
        color: colors.text,
        fontWeight: "500" as const,
    },
    toggleRow: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
    },
    toggle: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 2,
        justifyContent: "center" as const,
    },
    toggleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textSecondary,
    },
    toggleKnobActive: {
        backgroundColor: colors.text,
        alignSelf: "flex-end" as const,
    },
});

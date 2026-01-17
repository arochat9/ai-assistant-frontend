import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { tasksApi } from "../services/api";
import type { Task, TasksResponse } from "../types";

interface UseTaskMutationsOptions {
    onCreateSuccess?: () => void;
    onUpdateSuccess?: (task?: Task) => void;
}

export function useTaskMutations({ onCreateSuccess, onUpdateSuccess }: UseTaskMutationsOptions) {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: tasksApi.createTask,
        onMutate: async (newTask) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });

            const previousQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });

            const optimisticTask: Task = {
                ...newTask,
                taskId: `temp-${Date.now()}`,
                taskName: newTask.taskName || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            previousQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: [optimisticTask, ...oldData.tasks],
                });
            });

            onCreateSuccess?.();
            return { previousQueries };
        },
        onSuccess: (response) => {
            if (!response.task) return;

            const allCachedQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });
            allCachedQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                const updatedTasks = oldData.tasks.map((task) =>
                    task.taskId.startsWith("temp-") ? response.task! : task
                );

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: updatedTasks,
                });
            });
        },
        onError: (error: Error, _newTask, context) => {
            context?.previousQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            Alert.alert("Error", `Failed to create task: ${error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: tasksApi.updateTask,
        onMutate: async (updatedTask) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });

            const previousQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });

            let optimisticTask: Task | undefined;

            previousQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                const updatedTasks = oldData.tasks.map((task) => {
                    if (task.taskId !== updatedTask.taskId) return task;

                    const updated = {
                        ...task,
                        ...updatedTask,
                        updatedAt: new Date(),
                    };

                    if (!optimisticTask) {
                        optimisticTask = updated;
                    }

                    return updated;
                });

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: updatedTasks,
                });
            });

            onUpdateSuccess?.(optimisticTask);

            return { previousQueries, updatedTaskId: updatedTask.taskId };
        },
        onSuccess: (response) => {
            if (!response.task) return;

            const allCachedQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });
            allCachedQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                const updatedTasks = oldData.tasks.map((task) =>
                    task.taskId === response.task!.taskId ? response.task! : task
                );

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: updatedTasks,
                });
            });
        },
        onError: (error: Error, _updatedTask, context) => {
            context?.previousQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            Alert.alert("Error", `Failed to update task: ${error.message}`);
        },
    });

    return {
        createMutation,
        updateMutation,
    };
}

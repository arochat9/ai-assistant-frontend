import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksApi } from "../services/api";
import type { Task, TasksResponse, TaskFilters } from "shared";

interface UseTaskMutationsOptions {
    filters: TaskFilters;
    onCreateSuccess?: () => void;
    onUpdateSuccess?: (task?: Task) => void;
}

export function useTaskMutations({ filters, onCreateSuccess, onUpdateSuccess }: UseTaskMutationsOptions) {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: tasksApi.createTask,
        onMutate: async (newTask) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });

            // Snapshot all task queries
            const previousQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });

            // Create optimistic task
            const optimisticTask: Task = {
                ...newTask,
                taskId: `temp-${Date.now()}`,
                taskName: newTask.taskName || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Update ALL cached task queries (not just current filter)
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

            // Replace temp task with real task from server
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

            toast.success("Task created successfully");
        },
        onError: (error: Error, _newTask, context) => {
            // Rollback all queries
            context?.previousQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            toast.error(`Failed to create task: ${error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: tasksApi.updateTask,
        onMutate: async (updatedTask) => {
            await queryClient.cancelQueries({ queryKey: ["tasks"] });

            // Snapshot all task queries
            const previousQueries = queryClient.getQueriesData<TasksResponse>({ queryKey: ["tasks"] });

            // Optimistically update all cached queries
            previousQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;

                const updatedTasks = oldData.tasks.map((task) => {
                    if (task.taskId !== updatedTask.taskId) return task;

                    return {
                        ...task,
                        ...updatedTask,
                        updatedAt: new Date(),
                    };
                });

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: updatedTasks,
                });
            });

            // Close dialog immediately with optimistic data
            const currentData = queryClient.getQueryData<TasksResponse>(["tasks", filters]);
            const optimisticTask = currentData?.tasks.find((t) => t.taskId === updatedTask.taskId);
            onUpdateSuccess?.(optimisticTask);

            return { previousQueries, updatedTaskId: updatedTask.taskId };
        },
        onSuccess: (response) => {
            if (!response.task) return;

            // Sync with real server data
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

            toast.success("Task updated successfully");
        },
        onError: (error: Error, _updatedTask, context) => {
            // Rollback all queries
            context?.previousQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            toast.error(`Failed to update task: ${error.message}`);
        },
    });

    return {
        createMutation,
        updateMutation,
    };
}

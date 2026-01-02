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
                taskId: `temp-${Date.now()}`,
                taskName: newTask.task_name,
                status: newTask.status,
                subType: newTask.task_type,
                taskOrEvent: newTask.task_or_event,
                taskContext: newTask.task_context,
                taskDueTime: newTask.task_due_time,
                eventStartTime: newTask.event_start_time,
                eventEndTime: newTask.event_end_time,
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

            // Replace temp task with real task in ALL caches
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
                        taskName: updatedTask.task_name ?? task.taskName,
                        status: updatedTask.status ?? task.status,
                        subType: updatedTask.task_type ?? task.subType,
                        taskOrEvent: updatedTask.task_or_event ?? task.taskOrEvent,
                        taskContext: updatedTask.task_context ?? task.taskContext,
                        taskDueTime: updatedTask.task_due_time ?? task.taskDueTime,
                        eventStartTime: updatedTask.event_start_time ?? task.eventStartTime,
                        eventEndTime: updatedTask.event_end_time ?? task.eventEndTime,
                        updatedAt: new Date(),
                    };
                });

                queryClient.setQueryData<TasksResponse>(queryKey, {
                    ...oldData,
                    tasks: updatedTasks,
                });
            });

            // Close dialog and update selected task immediately
            const currentData = queryClient.getQueryData<TasksResponse>(["tasks", filters]);
            const optimisticTask = currentData?.tasks.find((t) => t.taskId === updatedTask.taskId);
            if (optimisticTask) {
                onUpdateSuccess?.(optimisticTask);
            }

            return { previousQueries, updatedTaskId: updatedTask.taskId };
        },
        onSuccess: (response, _variables, context) => {
            if (!response.task) return;

            // Update all caches with real server data
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

            // Update selected task with real data
            if (context?.updatedTaskId === response.task.taskId) {
                onUpdateSuccess?.(response.task);
            }

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

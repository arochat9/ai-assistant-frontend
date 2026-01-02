import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { tasksApi } from "../services/api";
import { Button } from "../components/ui/button";
import { TaskFilters } from "../components/tasks/TaskFilters";
import { TasksTable } from "../components/tasks/TasksTable";
import { TaskCreateDialog } from "../components/tasks/TaskCreateDialog";
import { TaskEditDialog } from "../components/tasks/TaskEditDialog";
import { TaskPanel } from "../components/tasks/TaskPanel";
import { EmptyState } from "../components/tasks/EmptyState";
import { useTaskMutations } from "../hooks/useTaskMutations";
import type { TaskFilters as TaskFiltersType, Task } from "shared";
import { TaskStatus } from "shared";

export function TasksPage() {
    const [filters, setFilters] = useState<TaskFiltersType>({ status: TaskStatus.OPEN });
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks", filters],
        queryFn: () => tasksApi.getTasks(filters),
    });

    const { createMutation, updateMutation } = useTaskMutations({
        filters,
        onCreateSuccess: useCallback(() => setCreateDialogOpen(false), []),
        onUpdateSuccess: useCallback(
            (task?: Task) => {
                setEditTask(null);
                if (task && selectedTask?.taskId === task.taskId) {
                    setSelectedTask(task);
                }
            },
            [selectedTask]
        ),
    });

    const handleFilterChange = useCallback((key: keyof TaskFiltersType, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    }, []);

    const clearFilters = useCallback(() => setFilters({}), []);

    const handleRowClick = useCallback((task: Task) => {
        setSelectedTask(task);
    }, []);

    const handleEditFromPanel = useCallback((task: Task) => {
        setEditTask(task);
    }, []);

    return (
        <div className="h-full p-8 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tasks</h2>
                    <p className="text-sm text-muted-foreground">Manage and track your tasks</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <TaskFilters filters={filters} onFilterChange={handleFilterChange} onClearFilters={clearFilters} />

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-muted-foreground">Loading tasks...</p>
                </div>
            ) : error ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-destructive">Error loading tasks: {error.message}</p>
                </div>
            ) : !data?.tasks || data.tasks.length === 0 ? (
                <EmptyState onCreateTask={() => setCreateDialogOpen(true)} />
            ) : (
                <div className="flex gap-4 flex-1 min-h-0">
                    <div className="flex-1 min-h-0">
                        <TasksTable tasks={data.tasks} onEditTask={setEditTask} onRowClick={handleRowClick} />
                    </div>
                    {selectedTask && (
                        <TaskPanel
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onEdit={handleEditFromPanel}
                        />
                    )}
                </div>
            )}

            <TaskCreateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={createMutation.mutate}
                isLoading={createMutation.isPending}
            />

            {editTask && (
                <TaskEditDialog
                    open={!!editTask}
                    onOpenChange={(open) => !open && setEditTask(null)}
                    onSubmit={updateMutation.mutate}
                    isLoading={updateMutation.isPending}
                    task={editTask}
                />
            )}
        </div>
    );
}

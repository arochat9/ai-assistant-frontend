import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { tasksApi } from "../services/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TaskFilters } from "../components/tasks/TaskFilters";
import { TasksTable } from "../components/tasks/TasksTable";
import { EmptyState } from "../components/tasks/EmptyState";
import { useTaskDialog } from "../contexts/TaskDialogContext";
import { TaskOrEvent } from "shared";
import type { TaskFilters as TaskFiltersType } from "shared";

const DEFAULT_FILTERS: TaskFiltersType = { isRecurring: false };

export function TasksPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const chatIdParam = searchParams.get("chatId");
    const chatNameParam = searchParams.get("chatName");

    const [filters, setFilters] = useState<TaskFiltersType>(() => ({
        ...DEFAULT_FILTERS,
        ...(chatIdParam ? { chatId: chatIdParam } : {}),
    }));

    // Sync chatId param into filters
    useEffect(() => {
        if (chatIdParam) {
            setFilters((prev) => ({ ...prev, chatId: chatIdParam }));
        }
    }, [chatIdParam]);

    const clearChatFilter = useCallback(() => {
        setFilters((prev) => {
            const { chatId, ...rest } = prev;
            return rest;
        });
        setSearchParams({}, { replace: true });
    }, [setSearchParams]);
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const { openCreateDialog } = useTaskDialog();

    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks", filters],
        queryFn: () => tasksApi.getTasks({
            ...filters,
            ...(filters.chatId ? {} : { taskOrEvent: TaskOrEvent.TASK }),
        }),
    });

    const handleFilterChange = useCallback((key: keyof TaskFiltersType, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    }, []);

    const handleSortChange = useCallback((key: string, direction: "asc" | "desc") => {
        setSortKey(key);
        setSortDirection(direction);
    }, []);

    const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

    return (
        <div className="h-full p-8 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tasks</h2>
                    <p className="text-sm text-muted-foreground">Manage and track your tasks</p>
                    {filters.chatId && (
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                Chat: {chatNameParam || filters.chatId}
                                <button onClick={clearChatFilter} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        </div>
                    )}
                </div>
                <Button onClick={() => openCreateDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>

            <TaskFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
            />

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-muted-foreground">Loading tasks...</p>
                </div>
            ) : error ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-destructive">Error loading tasks: {error.message}</p>
                </div>
            ) : !data?.tasks || data.tasks.length === 0 ? (
                <EmptyState onCreateTask={() => openCreateDialog()} />
            ) : (
                <div className="flex-1 min-h-0">
                    <TasksTable
                        tasks={data.tasks}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSortChange={handleSortChange}
                    />
                </div>
            )}
        </div>
    );
}

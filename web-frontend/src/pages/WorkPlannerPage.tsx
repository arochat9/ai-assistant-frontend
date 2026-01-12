import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { tasksApi } from "../services/api";
import { DataTable, type ColumnDef } from "../components/ui/data-table";
import { useTaskDrawer } from "../contexts/TaskDrawerContext";
import { useTaskDialog } from "../contexts/TaskDialogContext";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { PlannedFor, TaskOrEvent } from "shared";
import type { Task, TaskStatus } from "shared";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { SortSelector } from "../components/ui/SortSelector";

interface PlannerTableProps {
    title: string;
    tasks: Task[];
    groupBy?: (task: Task) => string | undefined;
    plannedForValues?: Record<string, PlannedFor>;
    defaultPlannedFor?: PlannedFor;
    onDrop: (task: Task, newPlannedFor?: PlannedFor) => void;
    draggedTask: Task | null;
    setDraggedTask: (task: Task | null) => void;
    allGroups?: string[];
    onCreateClick?: () => void;
    sortKey?: string;
    sortDirection?: "asc" | "desc";
    onSortChange?: (key: string, direction: "asc" | "desc") => void;
    showSortSelector?: boolean;
}

function PlannerTable({
    title,
    tasks,
    groupBy,
    plannedForValues,
    defaultPlannedFor,
    onDrop,
    draggedTask,
    setDraggedTask,
    allGroups,
    onCreateClick,
    sortKey = "taskName",
    sortDirection = "asc",
    onSortChange,
    showSortSelector = false,
}: PlannerTableProps) {
    const { openDrawer } = useTaskDrawer();
    const { updateMutation } = useTaskMutations({});
    const [isDragOver, setIsDragOver] = useState(false);

    const handleCellEdit = async (task: Task, columnKey: string, newValue: unknown) => {
        const updates = {
            taskId: task.taskId,
            taskOrEvent: task.taskOrEvent,
            status: task.status,
            subType: task.subType,
        };

        if (columnKey === "taskName") {
            await updateMutation.mutateAsync({ ...updates, taskName: newValue as string });
        } else if (columnKey === "plannedFor") {
            await updateMutation.mutateAsync({ ...updates, plannedFor: newValue as PlannedFor });
        } else if (columnKey === "status") {
            await updateMutation.mutateAsync({ ...updates, status: newValue as TaskStatus });
        }
    };

    const columns: ColumnDef<Task>[] = [
        {
            key: "status",
            header: "",
            width: "40px",
            sortable: true,
            editable: true,
            editType: "checkbox",
            accessor: (task) => task.status,
        },
        {
            key: "taskName",
            header: "Task Name",
            sortable: true,
            editable: true,
            accessor: (task) => task.taskName,
            sortValue: (task) => task.taskName?.toLowerCase() || "",
            cell: (value) => <span className="font-medium">{(value as string) || "Untitled"}</span>,
        },
        {
            key: "createdAt",
            header: "Created",
            sortable: true,
            hidden: true,
            accessor: (task) => task.createdAt,
            sortValue: (task) => task.createdAt.getTime(),
        },
    ];

    const sortOptions = [
        { value: "taskName", label: "Name" },
        { value: "status", label: "Status" },
        { value: "createdAt", label: "Created" },
    ];

    return (
        <div
            className="flex flex-col h-full min-h-0"
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                // Only handle if not already handled by a group drop
                if (e.defaultPrevented) return;
                e.preventDefault();
                setIsDragOver(false);
                if (draggedTask) {
                    onDrop(draggedTask, defaultPlannedFor);
                    setDraggedTask(null);
                }
            }}
        >
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex items-center gap-2">
                    {showSortSelector && onSortChange && (
                        <SortSelector
                            sortKey={sortKey}
                            sortDirection={sortDirection}
                            onSortChange={onSortChange}
                            options={sortOptions}
                        />
                    )}
                    {onCreateClick && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCreateClick}
                            className="h-8 w-8 p-0"
                            title="Create new task"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <div className={`flex-1 min-h-0 transition-colors ${isDragOver ? "bg-primary/10 rounded-lg" : ""}`}>
                {tasks.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border bg-muted/10">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                ) : (
                    <DataTable
                        data={tasks}
                        columns={columns}
                        getRowKey={(task) => task.taskId}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSortChange={onSortChange}
                        onCellEdit={handleCellEdit}
                        showDrawerColumn
                        drawerColumnWidth="30px"
                        onDrawerClick={openDrawer}
                        groupBy={groupBy}
                        groupHeader={(value) => value || "Unplanned"}
                        allGroups={allGroups}
                        draggable
                        onDragStart={setDraggedTask}
                        onGroupDrop={(groupValue) => {
                            if (draggedTask) {
                                const plannedFor = plannedForValues?.[groupValue || ""] || defaultPlannedFor;
                                onDrop(draggedTask, plannedFor);
                                setDraggedTask(null);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export function WorkPlannerPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksApi.getTasks({ taskOrEvent: TaskOrEvent.TASK }),
    });
    const { updateMutation } = useTaskMutations({});
    const { openCreateDialog } = useTaskDialog();
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const [sortKey, setSortKey] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const handleSortChange = (key: string, direction: "asc" | "desc") => {
        setSortKey(key);
        setSortDirection(direction);
    };

    const todayTasks =
        data?.tasks.filter(
            (task) => task.plannedFor === PlannedFor.TODAY || task.plannedFor === PlannedFor.TODAY_STRETCH_GOAL
        ) || [];

    const tomorrowTasks =
        data?.tasks.filter(
            (task) => task.plannedFor === PlannedFor.TOMORROW || task.plannedFor === PlannedFor.TOMORROW_STRETCH_GOAL
        ) || [];

    const weekTasks =
        data?.tasks.filter(
            (task) => task.plannedFor === PlannedFor.THIS_WEEK || task.plannedFor === PlannedFor.THIS_WEEK_STRETCH_GOAL
        ) || [];

    const unplannedTasks = data?.tasks.filter((task) => !task.plannedFor) || [];

    const handleDrop = async (task: Task, newPlannedFor?: PlannedFor) => {
        if (task.plannedFor === newPlannedFor) return;

        await updateMutation.mutateAsync({
            taskId: task.taskId,
            taskOrEvent: task.taskOrEvent,
            status: task.status,
            subType: task.subType,
            plannedFor: newPlannedFor,
        });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 min-h-0 p-6 overflow-hidden">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Loading tasks...</p>
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-destructive">Error loading tasks: {error.message}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-6 h-full">
                        <div className="flex flex-col gap-6 min-h-0">
                            <div className="flex-1 min-h-0">
                                <PlannerTable
                                    title="Today"
                                    tasks={todayTasks}
                                    groupBy={(task) => task.plannedFor}
                                    plannedForValues={{
                                        [PlannedFor.TODAY]: PlannedFor.TODAY,
                                        [PlannedFor.TODAY_STRETCH_GOAL]: PlannedFor.TODAY_STRETCH_GOAL,
                                    }}
                                    defaultPlannedFor={PlannedFor.TODAY}
                                    onDrop={handleDrop}
                                    draggedTask={draggedTask}
                                    setDraggedTask={setDraggedTask}
                                    allGroups={[PlannedFor.TODAY, PlannedFor.TODAY_STRETCH_GOAL]}
                                    onCreateClick={() => openCreateDialog({ plannedFor: PlannedFor.TODAY })}
                                />
                            </div>
                            <div className="flex-1 min-h-0">
                                <PlannerTable
                                    title="Tomorrow"
                                    tasks={tomorrowTasks}
                                    groupBy={(task) => task.plannedFor}
                                    plannedForValues={{
                                        [PlannedFor.TOMORROW]: PlannedFor.TOMORROW,
                                        [PlannedFor.TOMORROW_STRETCH_GOAL]: PlannedFor.TOMORROW_STRETCH_GOAL,
                                    }}
                                    defaultPlannedFor={PlannedFor.TOMORROW}
                                    onDrop={handleDrop}
                                    draggedTask={draggedTask}
                                    setDraggedTask={setDraggedTask}
                                    allGroups={[PlannedFor.TOMORROW, PlannedFor.TOMORROW_STRETCH_GOAL]}
                                    onCreateClick={() => openCreateDialog({ plannedFor: PlannedFor.TOMORROW })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 min-h-0">
                            <div className="flex-1 min-h-0">
                                <PlannerTable
                                    title="This Week"
                                    tasks={weekTasks}
                                    groupBy={(task) => task.plannedFor}
                                    plannedForValues={{
                                        [PlannedFor.THIS_WEEK]: PlannedFor.THIS_WEEK,
                                        [PlannedFor.THIS_WEEK_STRETCH_GOAL]: PlannedFor.THIS_WEEK_STRETCH_GOAL,
                                    }}
                                    defaultPlannedFor={PlannedFor.THIS_WEEK}
                                    onDrop={handleDrop}
                                    draggedTask={draggedTask}
                                    setDraggedTask={setDraggedTask}
                                    allGroups={[PlannedFor.THIS_WEEK, PlannedFor.THIS_WEEK_STRETCH_GOAL]}
                                    onCreateClick={() => openCreateDialog({ plannedFor: PlannedFor.THIS_WEEK })}
                                />
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Recurring Tasks</h3>
                                <div className="flex-1 min-h-0 flex items-center justify-center rounded-lg border bg-muted/10">
                                    <p className="text-sm text-muted-foreground">Coming soon</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col min-h-0">
                            <PlannerTable
                                title="Unplanned Tasks"
                                tasks={unplannedTasks}
                                defaultPlannedFor={undefined}
                                onDrop={handleDrop}
                                draggedTask={draggedTask}
                                setDraggedTask={setDraggedTask}
                                onCreateClick={() => openCreateDialog({ plannedFor: undefined })}
                                sortKey={sortKey}
                                sortDirection={sortDirection}
                                onSortChange={handleSortChange}
                                showSortSelector
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

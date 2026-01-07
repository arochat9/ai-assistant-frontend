import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "../services/api";
import { DataTable, type ColumnDef } from "../components/ui/data-table";
import { useTaskDrawer } from "../contexts/TaskDrawerContext";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { PlannedFor } from "shared";
import type { Task, TaskStatus } from "shared";

interface PlannerTableProps {
    title: string;
    tasks: Task[];
    groupBy?: (task: Task) => string | undefined;
}

function PlannerTable({ title, tasks, groupBy }: PlannerTableProps) {
    const { openDrawer } = useTaskDrawer();
    const { updateMutation } = useTaskMutations({});

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
    ];

    return (
        <div className="flex flex-col h-full min-h-0">
            <h3 className="text-lg font-semibold mb-2 flex-shrink-0">{title}</h3>
            <div className="flex-1 min-h-0">
                {tasks.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border bg-muted/10">
                        <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                ) : (
                    <DataTable
                        data={tasks}
                        columns={columns}
                        getRowKey={(task) => task.taskId}
                        defaultSortKey="taskName"
                        defaultSortDirection="asc"
                        onCellEdit={handleCellEdit}
                        showDrawerColumn
                        drawerColumnWidth="30px"
                        onDrawerClick={openDrawer}
                        groupBy={groupBy}
                        groupHeader={(value) => value || "Unplanned"}
                    />
                )}
            </div>
        </div>
    );
}

export function WorkPlannerPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksApi.getTasks({}),
    });

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
                                <PlannerTable title="Today" tasks={todayTasks} groupBy={(task) => task.plannedFor} />
                            </div>
                            <div className="flex-1 min-h-0">
                                <PlannerTable
                                    title="Tomorrow"
                                    tasks={tomorrowTasks}
                                    groupBy={(task) => task.plannedFor}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 min-h-0">
                            <div className="flex-1 min-h-0">
                                <PlannerTable title="This Week" tasks={weekTasks} groupBy={(task) => task.plannedFor} />
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Recurring Tasks</h3>
                                <div className="flex-1 min-h-0 flex items-center justify-center rounded-lg border bg-muted/10">
                                    <p className="text-sm text-muted-foreground">Coming soon</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col min-h-0">
                            <PlannerTable title="Unplanned Tasks" tasks={unplannedTasks} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

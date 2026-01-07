import { Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DataTable, type ColumnDef } from "../ui/data-table";
import { useTaskDrawer } from "../../contexts/TaskDrawerContext";
import { useTaskDialog } from "../../contexts/TaskDialogContext";
import { useTaskMutations } from "../../hooks/useTaskMutations";
import { getSubTypeValues } from "shared";
import type { Task, TaskStatus, SubType, PlannedFor } from "shared";

interface TasksTableProps {
    tasks: Task[];
    sortKey?: string;
    sortDirection?: "asc" | "desc";
    onSortChange?: (key: string, direction: "asc" | "desc") => void;
}

export function TasksTable({ tasks, sortKey, sortDirection, onSortChange }: TasksTableProps) {
    const { openDrawer } = useTaskDrawer();
    const { openEditDialog } = useTaskDialog();
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
        } else if (columnKey === "status") {
            await updateMutation.mutateAsync({ ...updates, status: newValue as TaskStatus });
        } else if (columnKey === "subType") {
            await updateMutation.mutateAsync({ ...updates, subType: newValue as SubType });
        } else if (columnKey === "plannedFor") {
            await updateMutation.mutateAsync({ ...updates, plannedFor: newValue as PlannedFor });
        }
    };

    const columns: ColumnDef<Task>[] = [
        {
            key: "status",
            header: "S",
            width: "40px",
            sortable: true,
            editable: true,
            editType: "checkbox",
            accessor: (task) => task.status,
        },
        {
            key: "taskName",
            header: "Name",
            sortable: true,
            editable: true,
            accessor: (task) => task.taskName,
            sortValue: (task) => task.taskName?.toLowerCase() || "",
            cell: (value) => <span className="font-medium">{(value as string) || "Untitled"}</span>,
        },
        {
            key: "subType",
            header: "Subtype",
            width: "130px",
            sortable: true,
            editable: true,
            editType: "select",
            selectOptions: getSubTypeValues(),
            accessor: (task) => task.subType,
            cell: (value) => <Badge variant="outline">{(value as string) || "N/A"}</Badge>,
        },
        {
            key: "taskDueTime",
            header: "Due Date",
            sortable: true,
            editable: false,
            accessor: (task) => task.taskDueTime,
            sortValue: (task) => task.taskDueTime?.getTime() || 0,
            cell: (value) => (value ? new Date(value as Date).toLocaleDateString() : "-"),
        },
        {
            key: "createdAt",
            header: "Created",
            width: "160px",
            sortable: true,
            editable: false,
            accessor: (task) => task.createdAt,
            sortValue: (task) => task.createdAt.getTime(),
            cell: (value) =>
                (value as Date).toLocaleString(undefined, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
        },
        {
            key: "updatedAt",
            header: "Last Updated",
            width: "160px",
            sortable: true,
            editable: false,
            accessor: (task) => task.updatedAt,
            sortValue: (task) => task.updatedAt.getTime(),
            cell: (value) =>
                (value as Date).toLocaleString(undefined, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }),
        },
    ];

    return (
        <DataTable
            data={tasks}
            columns={columns}
            getRowKey={(task) => task.taskId}
            defaultSortKey="createdAt"
            defaultSortDirection="desc"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={onSortChange}
            onCellEdit={handleCellEdit}
            showDrawerColumn
            drawerColumnWidth="60px"
            onDrawerClick={openDrawer}
            actionsColumn={(task) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(task);
                    }}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            )}
            actionsColumnWidth="60px"
        />
    );
}

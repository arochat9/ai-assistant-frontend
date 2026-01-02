import { useState, useMemo } from "react";
import { Edit, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { Task } from "shared";

type SortField = "taskName" | "status" | "subType" | "taskDueTime" | "updatedAt";
type SortDirection = "asc" | "desc";

interface TasksTableProps {
    tasks: Task[];
    onEditTask: (task: Task) => void;
    onRowClick: (task: Task) => void;
}

export function TasksTable({ tasks, onEditTask, onRowClick }: TasksTableProps) {
    const [sortField, setSortField] = useState<SortField>("updatedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            "Not Started": "outline",
            "In Progress": "default",
            Completed: "secondary",
            Cancelled: "destructive",
        };
        return statusMap[status] || "outline";
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            let aValue: string | number | Date | undefined;
            let bValue: string | number | Date | undefined;

            switch (sortField) {
                case "taskName":
                    aValue = a.taskName?.toLowerCase() || "";
                    bValue = b.taskName?.toLowerCase() || "";
                    break;
                case "status":
                    aValue = a.status || "";
                    bValue = b.status || "";
                    break;
                case "subType":
                    aValue = a.subType || "";
                    bValue = b.subType || "";
                    break;
                case "taskDueTime":
                    aValue = a.taskDueTime?.getTime() || 0;
                    bValue = b.taskDueTime?.getTime() || 0;
                    break;
                case "updatedAt":
                    aValue = a.updatedAt.getTime();
                    bValue = b.updatedAt.getTime();
                    break;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [tasks, sortField, sortDirection]);

    return (
        <div className="rounded-lg border h-full overflow-auto">
            <table className="w-full caption-bottom text-sm relative">
                <thead>
                    <tr className="transition-colors hover:bg-muted/50">
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("taskName")}
                                className="h-auto p-0 hover:bg-transparent font-semibold"
                            >
                                Name
                                {getSortIcon("taskName")}
                            </Button>
                        </th>
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("status")}
                                className="h-auto p-0 hover:bg-transparent font-semibold"
                            >
                                Status
                                {getSortIcon("status")}
                            </Button>
                        </th>
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("subType")}
                                className="h-auto p-0 hover:bg-transparent font-semibold"
                            >
                                Subtype
                                {getSortIcon("subType")}
                            </Button>
                        </th>
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("taskDueTime")}
                                className="h-auto p-0 hover:bg-transparent font-semibold"
                            >
                                Due Date
                                {getSortIcon("taskDueTime")}
                            </Button>
                        </th>
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("updatedAt")}
                                className="h-auto p-0 hover:bg-transparent font-semibold"
                            >
                                Last Updated
                                {getSortIcon("updatedAt")}
                            </Button>
                        </th>
                        <th
                            className="sticky top-0 z-10 bg-background h-10 px-2 text-right align-middle font-medium text-muted-foreground"
                            style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                        >
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {sortedTasks.map((task) => (
                        <tr
                            key={task.taskId}
                            className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                            onClick={() => onRowClick(task)}
                        >
                            <td className="p-2 align-middle font-medium">{task.taskName || "Untitled"}</td>
                            <td className="p-2 align-middle">
                                <Badge variant={getStatusColor(task.status || "")}>{task.status || "Unknown"}</Badge>
                            </td>
                            <td className="p-2 align-middle">
                                <Badge variant="outline">{task.subType || "N/A"}</Badge>
                            </td>
                            <td className="p-2 align-middle">
                                {task.taskDueTime ? new Date(task.taskDueTime).toLocaleDateString() : "-"}
                            </td>
                            <td className="p-2 align-middle">
                                {task.updatedAt.toLocaleString(undefined, {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </td>
                            <td className="p-2 align-middle text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTask(task);
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

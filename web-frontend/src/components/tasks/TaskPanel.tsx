import { X, Edit, Calendar, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { Task } from "shared";

interface TaskPanelProps {
    task: Task;
    onClose: () => void;
    onEdit: (task: Task) => void;
}

export function TaskPanel({ task, onClose, onEdit }: TaskPanelProps) {
    const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            "Not Started": "outline",
            "In Progress": "default",
            Completed: "secondary",
            Cancelled: "destructive",
        };
        return statusMap[status] || "outline";
    };

    const formatDate = (date: Date | undefined): string => {
        if (!date) return "Not set";
        return new Date(date).toLocaleString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateOnly = (date: Date | undefined): string => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="w-96 border rounded-lg bg-background flex flex-col h-full">
            <div className="flex items-center justify-between border-b bg-muted/50 p-4">
                <h3 className="text-base font-semibold">Task Details</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {/* Task Name */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">{task.taskName || "Untitled Task"}</h2>
                    <div className="flex gap-2">
                        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge variant="outline">{task.subType}</Badge>
                        <Badge variant="outline">{task.taskOrEvent}</Badge>
                    </div>
                </div>

                {/* Context/Description */}
                {task.taskContext && (
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                        <p className="text-sm whitespace-pre-wrap">{task.taskContext}</p>
                    </div>
                )}

                {/* Due Date */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due Date
                    </h4>
                    <p className="text-sm">{formatDateOnly(task.taskDueTime)}</p>
                </div>

                {/* Event Times (if applicable) */}
                {(task.eventStartTime || task.eventEndTime) && (
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Event Times
                        </h4>
                        <div className="space-y-1 text-sm">
                            <div>
                                <span className="font-medium">Start: </span>
                                {formatDate(task.eventStartTime)}
                            </div>
                            <div>
                                <span className="font-medium">End: </span>
                                {formatDate(task.eventEndTime)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Approval Status (if applicable) */}
                {task.eventApprovalStatus && (
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Event Approval</h4>
                        <Badge variant="outline">{task.eventApprovalStatus}</Badge>
                    </div>
                )}

                {/* Timestamps */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Timestamps</h4>
                    <div className="space-y-1 text-sm">
                        <div>
                            <span className="font-medium">Created: </span>
                            {formatDate(task.createdAt)}
                        </div>
                        <div>
                            <span className="font-medium">Updated: </span>
                            {formatDate(task.updatedAt)}
                        </div>
                        {task.completedAt && (
                            <div>
                                <span className="font-medium">Completed: </span>
                                {formatDate(task.completedAt)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Source Message IDs */}
                {task.sourceMessageIds && task.sourceMessageIds.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Source Messages</h4>
                        <div className="space-y-1">
                            {task.sourceMessageIds.map((id, index) => (
                                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                                    {id}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Task ID */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Task ID</h4>
                    <p className="text-xs font-mono bg-muted p-2 rounded">{task.taskId}</p>
                    {task.unversionedTaskId && (
                        <div className="mt-2">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Unversioned ID</h4>
                            <p className="text-xs font-mono bg-muted p-2 rounded">{task.unversionedTaskId}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

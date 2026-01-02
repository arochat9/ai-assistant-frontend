import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskStatus, TaskOrEvent, Environment, SubType, RunId } from "shared";
import type { CreateTaskInput, UpdateTaskInput, Task } from "shared";

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void;
    isLoading: boolean;
    mode: "create" | "edit";
    task?: Task | null;
}

export function TaskDialog({ open, onOpenChange, onSubmit, isLoading, mode, task }: TaskDialogProps) {
    const [formData, setFormData] = useState<CreateTaskInput | UpdateTaskInput>(
        mode === "create"
            ? {
                  environment: Environment.PRODUCTION,
                  runID: RunId.BASELINE,
                  sourceMessageIds: [],
                  status: TaskStatus.OPEN,
                  task_name: "",
                  task_or_event: TaskOrEvent.TASK,
                  task_type: SubType.CHORE,
              }
            : {
                  taskId: task?.taskId as string,
                  runId: RunId.BASELINE,
                  task_name: task?.taskName || "",
                  task_type: (task?.subType as SubType) || undefined,
                  task_or_event: (task?.taskOrEvent as TaskOrEvent) || undefined,
                  status: (task?.status as TaskStatus) || undefined,
                  task_context: task?.taskContext || "",
                  task_due_time: task?.taskDueTime ? new Date(task.taskDueTime) : undefined,
                  event_start_time: task?.eventStartTime ? new Date(task.eventStartTime) : undefined,
                  event_end_time: task?.eventEndTime ? new Date(task.eventEndTime) : undefined,
              }
    );
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "create") {
            onSubmit(formData);
        } else {
            // For updates, only include fields that have actually changed
            const updateData: Partial<UpdateTaskInput> = {
                taskId: task?.taskId as string,
                runId: RunId.BASELINE,
            };

            // Helper to normalize empty strings to undefined for comparison
            const normalize = (val: string | undefined) => (val === "" ? undefined : val);

            if ("task_name" in formData && normalize(formData.task_name) !== task?.taskName) {
                updateData.task_name = formData.task_name;
            }
            if ("task_type" in formData && normalize(formData.task_type) !== task?.subType) {
                updateData.task_type = formData.task_type;
            }
            if ("task_or_event" in formData && normalize(formData.task_or_event) !== task?.taskOrEvent) {
                updateData.task_or_event = formData.task_or_event;
            }
            if ("status" in formData && normalize(formData.status) !== task?.status) {
                updateData.status = formData.status;
            }
            if ("task_context" in formData && normalize(formData.task_context) !== task?.taskContext) {
                updateData.task_context = formData.task_context;
            }
            if ("task_due_time" in formData && formData.task_due_time?.toISOString() !== task?.taskDueTime) {
                updateData.task_due_time = formData.task_due_time;
            }
            if ("event_start_time" in formData && formData.event_start_time?.toISOString() !== task?.eventStartTime) {
                updateData.event_start_time = formData.event_start_time;
            }
            if ("event_end_time" in formData && formData.event_end_time?.toISOString() !== task?.eventEndTime) {
                updateData.event_end_time = formData.event_end_time;
            }

            onSubmit(updateData as UpdateTaskInput);
        }
    };

    const handleChange = (field: string, value: string) => {
        if (field === "task_due_time" || field === "event_start_time" || field === "event_end_time") {
            setFormData((prev) => ({ ...prev, [field]: value ? new Date(value) : undefined }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const isEvent = "task_or_event" in formData && formData.task_or_event === TaskOrEvent.EVENT;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create New Task" : "Edit Task"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Add a new task or event to your list" : "Update task details"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="task_name">Task Name {mode === "create" && "*"}</Label>
                        <Input
                            id="task_name"
                            required={mode === "create"}
                            value={"task_name" in formData ? formData.task_name : ""}
                            onChange={(e) => handleChange("task_name", e.target.value)}
                            placeholder="Enter task name"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="task_or_event">Type {mode === "create" && "*"}</Label>
                            <Select
                                id="task_or_event"
                                required={mode === "create"}
                                value={"task_or_event" in formData ? formData.task_or_event : ""}
                                onChange={(e) => handleChange("task_or_event", e.target.value)}
                            >
                                <option value={TaskOrEvent.TASK}>Task</option>
                                <option value={TaskOrEvent.EVENT}>Event</option>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="task_type">Sub Type {mode === "create" && "*"}</Label>
                            <Select
                                id="task_type"
                                required={mode === "create"}
                                value={"task_type" in formData ? formData.task_type : ""}
                                onChange={(e) => handleChange("task_type", e.target.value)}
                            >
                                <option value="">Select type...</option>
                                <option value={SubType.FUN}>Fun</option>
                                <option value={SubType.TEXT_RESPONSE}>Text response</option>
                                <option value={SubType.CHORE}>Chore</option>
                                <option value={SubType.ERRAND}>Errand</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            id="status"
                            value={"status" in formData ? formData.status : ""}
                            onChange={(e) => handleChange("status", e.target.value)}
                        >
                            <option value={TaskStatus.OPEN}>Open</option>
                            <option value={TaskStatus.CLOSED}>Closed</option>
                            <option value={TaskStatus.BACKLOGGED}>Backlogged</option>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="task_context">Context</Label>
                        <Input
                            id="task_context"
                            value={"task_context" in formData ? formData.task_context || "" : ""}
                            onChange={(e) => handleChange("task_context", e.target.value)}
                            placeholder="Add additional context..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="task_due_time">Due Date</Label>
                        <Input
                            id="task_due_time"
                            type="datetime-local"
                            value={
                                "task_due_time" in formData && formData.task_due_time instanceof Date
                                    ? formData.task_due_time.toISOString().slice(0, 16)
                                    : ""
                            }
                            onChange={(e) => handleChange("task_due_time", e.target.value)}
                        />
                    </div>

                    {isEvent && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="event_start_time">Event Start</Label>
                                <Input
                                    id="event_start_time"
                                    type="datetime-local"
                                    value={
                                        "event_start_time" in formData && formData.event_start_time instanceof Date
                                            ? formData.event_start_time.toISOString().slice(0, 16)
                                            : ""
                                    }
                                    onChange={(e) => handleChange("event_start_time", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="event_end_time">Event End</Label>
                                <Input
                                    id="event_end_time"
                                    type="datetime-local"
                                    value={
                                        "event_end_time" in formData && formData.event_end_time instanceof Date
                                            ? formData.event_end_time.toISOString().slice(0, 16)
                                            : ""
                                    }
                                    onChange={(e) => handleChange("event_end_time", e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? mode === "create"
                                    ? "Creating..."
                                    : "Updating..."
                                : mode === "create"
                                ? "Create Task"
                                : "Update Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

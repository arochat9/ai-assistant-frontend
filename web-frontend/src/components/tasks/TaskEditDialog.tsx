import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskFormFields } from "./TaskFormFields";
import { TaskStatus, TaskOrEvent, SubType, RunId } from "shared";
import type { UpdateTaskInput, Task } from "shared";

interface TaskEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: UpdateTaskInput) => void;
    isLoading: boolean;
    task: Task;
}

type FormData = {
    task_name: string;
    task_type: SubType;
    task_or_event: TaskOrEvent;
    status: TaskStatus;
    task_context?: string;
    task_due_time?: Date;
    event_start_time?: Date;
    event_end_time?: Date;
};

export function TaskEditDialog({ open, onOpenChange, onSubmit, isLoading, task }: TaskEditDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        task_name: task.taskName || "",
        task_type: task.subType as SubType,
        task_or_event: task.taskOrEvent as TaskOrEvent,
        status: task.status as TaskStatus,
        task_context: task.taskContext,
        task_due_time: task.taskDueTime ? new Date(task.taskDueTime) : undefined,
        event_start_time: task.eventStartTime ? new Date(task.eventStartTime) : undefined,
        event_end_time: task.eventEndTime ? new Date(task.eventEndTime) : undefined,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updateData: Partial<UpdateTaskInput> = {
            taskId: task.taskId,
            runId: RunId.BASELINE,
        };

        if (formData.task_name !== task.taskName) {
            updateData.task_name = formData.task_name;
        }
        if (formData.task_type !== task.subType) {
            updateData.task_type = formData.task_type;
        }
        if (formData.task_or_event !== task.taskOrEvent) {
            updateData.task_or_event = formData.task_or_event;
        }
        if (formData.status !== task.status) {
            updateData.status = formData.status;
        }
        if (formData.task_context !== task.taskContext) {
            updateData.task_context = formData.task_context;
        }
        if (formData.task_due_time?.toISOString() !== task.taskDueTime) {
            updateData.task_due_time = formData.task_due_time;
        }
        if (formData.event_start_time?.toISOString() !== task.eventStartTime) {
            updateData.event_start_time = formData.event_start_time;
        }
        if (formData.event_end_time?.toISOString() !== task.eventEndTime) {
            updateData.event_end_time = formData.event_end_time;
        }

        onSubmit(updateData as UpdateTaskInput);
    };

    const handleChange = (field: string, value: string) => {
        if (field === "task_due_time" || field === "event_start_time" || field === "event_end_time") {
            setFormData((prev) => ({ ...prev, [field]: value ? new Date(value) : undefined }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>Update task details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <TaskFormFields
                        values={{
                            ...formData,
                            task_due_time: formData.task_due_time?.toISOString().slice(0, 16) || "",
                            event_start_time: formData.event_start_time?.toISOString().slice(0, 16) || "",
                            event_end_time: formData.event_end_time?.toISOString().slice(0, 16) || "",
                        }}
                        onChange={handleChange}
                    />

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
                            {isLoading ? "Updating..." : "Update Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

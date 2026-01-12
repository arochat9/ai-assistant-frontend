import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskFormFields } from "./TaskFormFields";
import { TaskStatus, TaskOrEvent, SubType, PlannedFor, Source, EventApprovalStatus } from "shared";
import type { UpdateTaskInput, Task } from "shared";
import { format } from "date-fns";

interface TaskEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: UpdateTaskInput) => void;
    isLoading: boolean;
    task: Task;
}

type FormData = {
    taskName: string;
    subType: SubType;
    taskOrEvent: TaskOrEvent;
    status: TaskStatus;
    userNotes?: string;
    taskDueTime?: Date;
    eventStartTime?: Date;
    eventEndTime?: Date;
    eventApprovalStatus?: EventApprovalStatus;
    plannedFor?: PlannedFor;
    source?: Source;
    tags?: string;
};

export function TaskEditDialog({ open, onOpenChange, onSubmit, isLoading, task }: TaskEditDialogProps) {
    const [formData, setFormData] = useState<FormData>({
        taskName: task.taskName || "",
        subType: task.subType as SubType,
        taskOrEvent: task.taskOrEvent as TaskOrEvent,
        status: task.status as TaskStatus,
        userNotes: task.userNotes,
        taskDueTime: task.taskDueTime ? new Date(task.taskDueTime) : undefined,
        eventStartTime: task.eventStartTime ? new Date(task.eventStartTime) : undefined,
        eventEndTime: task.eventEndTime ? new Date(task.eventEndTime) : undefined,
        eventApprovalStatus: task.eventApprovalStatus,
        plannedFor: task.plannedFor,
        source: task.source,
        tags: task.tags?.join(", ") || "",
    });

    const submitForm = () => {
        const updateData: UpdateTaskInput = {
            ...formData,
            taskId: task.taskId,
            tags: formData.tags
                ? formData.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                : undefined,
        };

        onSubmit(updateData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitForm();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitForm();
        }
    };

    const handleChange = (field: string, value: string) => {
        if (field === "taskDueTime" || field === "eventStartTime" || field === "eventEndTime") {
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
                            taskDueTime: formData.taskDueTime ? format(formData.taskDueTime, "yyyy-MM-dd'T'HH:mm") : "",
                            eventStartTime: formData.eventStartTime
                                ? format(formData.eventStartTime, "yyyy-MM-dd'T'HH:mm")
                                : "",
                            eventEndTime: formData.eventEndTime
                                ? format(formData.eventEndTime, "yyyy-MM-dd'T'HH:mm")
                                : "",
                            eventApprovalStatus: formData.eventApprovalStatus || "",
                        }}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
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

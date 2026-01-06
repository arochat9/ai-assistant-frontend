import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskFormFields } from "./TaskFormFields";
import { TaskStatus, TaskOrEvent, SubType, Source } from "shared";
import type { CreateTaskInput } from "shared";

interface TaskCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateTaskInput) => void;
    isLoading: boolean;
}

export function TaskCreateDialog({ open, onOpenChange, onSubmit, isLoading }: TaskCreateDialogProps) {
    const [formData, setFormData] = useState<CreateTaskInput>({
        status: TaskStatus.OPEN,
        taskName: "",
        taskOrEvent: TaskOrEvent.TASK,
        subType: SubType.FUN,
        source: Source.USER,
    });

    const handleChange = (field: string, value: string) => {
        if (field === "taskDueTime" || field === "eventStartTime" || field === "eventEndTime") {
            setFormData((prev) => ({ ...prev, [field]: value ? new Date(value) : undefined }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData: CreateTaskInput = {
            ...formData,
            tags:
                typeof formData.tags === "string" && formData.tags
                    ? (formData.tags as string)
                          .split(",")
                          .map((tag: string) => tag.trim())
                          .filter(Boolean)
                    : formData.tags,
        };
        onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a new task or event to your list</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <TaskFormFields
                        values={{
                            ...formData,
                            taskName: formData.taskName || "",
                            taskDueTime:
                                formData.taskDueTime instanceof Date
                                    ? formData.taskDueTime.toISOString().slice(0, 16)
                                    : "",
                            eventStartTime:
                                formData.eventStartTime instanceof Date
                                    ? formData.eventStartTime.toISOString().slice(0, 16)
                                    : "",
                            eventEndTime:
                                formData.eventEndTime instanceof Date
                                    ? formData.eventEndTime.toISOString().slice(0, 16)
                                    : "",
                            tags: Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags,
                        }}
                        onChange={handleChange}
                        showRequired
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
                            {isLoading ? "Creating..." : "Create Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

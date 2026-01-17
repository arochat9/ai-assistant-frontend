import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskFormFields } from "./TaskFormFields";
import { TaskStatus, TaskOrEvent, SubType, Source } from "shared";
import type { CreateTaskInput } from "shared";
import { format } from "date-fns";

interface TaskCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateTaskInput) => void;
    isLoading: boolean;
    defaults?: Partial<CreateTaskInput>;
}

const getDefaultFormData = (defaults?: Partial<CreateTaskInput>): CreateTaskInput => ({
    status: TaskStatus.OPEN,
    taskName: "",
    taskOrEvent: TaskOrEvent.TASK,
    subType: SubType.CHORE,
    source: Source.USER,
    isRecurring: false,
    ...defaults,
});

export function TaskCreateDialog({ open, onOpenChange, onSubmit, isLoading, defaults }: TaskCreateDialogProps) {
    const [formData, setFormData] = useState<CreateTaskInput>(() => getDefaultFormData(defaults));

    const handleChange = (field: string, value: string | boolean) => {
        if (field === "isRecurring") {
            setFormData((prev) => {
                const newData = { ...prev, isRecurring: value as boolean };
                if (value) {
                    // Clear fields that can't be set for recurring tasks
                    newData.plannedFor = undefined;
                    newData.taskDueTime = undefined;
                    newData.taskOrEvent = TaskOrEvent.TASK;
                    newData.source = Source.USER;
                }
                return newData;
            });
        } else if (field === "taskDueTime" || field === "eventStartTime" || field === "eventEndTime") {
            setFormData((prev) => ({ ...prev, [field]: value ? new Date(value as string) : undefined }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const submitForm = () => {
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

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
                                    ? format(formData.taskDueTime, "yyyy-MM-dd'T'HH:mm")
                                    : "",
                            eventStartTime:
                                formData.eventStartTime instanceof Date
                                    ? format(formData.eventStartTime, "yyyy-MM-dd'T'HH:mm")
                                    : "",
                            eventEndTime:
                                formData.eventEndTime instanceof Date
                                    ? format(formData.eventEndTime, "yyyy-MM-dd'T'HH:mm")
                                    : "",
                            eventApprovalStatus: formData.eventApprovalStatus || "",
                            tags: Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags,
                            isRecurring: formData.isRecurring,
                        }}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
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

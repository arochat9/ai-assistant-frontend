import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { TaskFormFields } from "./TaskFormFields";
import { TaskStatus, TaskOrEvent, Environment, SubType, RunId } from "shared";
import type { CreateTaskInput } from "shared";

interface TaskCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateTaskInput) => void;
    isLoading: boolean;
}

export function TaskCreateDialog({ open, onOpenChange, onSubmit, isLoading }: TaskCreateDialogProps) {
    const [formData, setFormData] = useState<CreateTaskInput>({
        environment: Environment.PRODUCTION,
        runID: RunId.BASELINE,
        sourceMessageIds: ["manual-creation"],
        status: TaskStatus.OPEN,
        task_name: "",
        task_or_event: TaskOrEvent.TASK,
        task_type: SubType.FUN,
    });

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
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a new task or event to your list</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit(formData);
                    }}
                    className="space-y-4"
                >
                    <TaskFormFields
                        values={{
                            ...formData,
                            task_due_time:
                                formData.task_due_time instanceof Date
                                    ? formData.task_due_time.toISOString().slice(0, 16)
                                    : "",
                            event_start_time:
                                formData.event_start_time instanceof Date
                                    ? formData.event_start_time.toISOString().slice(0, 16)
                                    : "",
                            event_end_time:
                                formData.event_end_time instanceof Date
                                    ? formData.event_end_time.toISOString().slice(0, 16)
                                    : "",
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

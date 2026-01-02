import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { TaskStatus, TaskOrEvent, SubType } from "shared";

interface TaskFormFieldsProps {
    values: {
        task_name: string;
        task_type: string;
        task_or_event: string;
        status: string;
        task_context?: string;
        task_due_time?: string;
        event_start_time?: string;
        event_end_time?: string;
    };
    onChange: (field: string, value: string) => void;
    showRequired?: boolean;
}

export function TaskFormFields({ values, onChange, showRequired = false }: TaskFormFieldsProps) {
    const isEvent = values.task_or_event === TaskOrEvent.EVENT;

    return (
        <>
            <div>
                <Label htmlFor="task_name">Task Name {showRequired && "*"}</Label>
                <Input
                    id="task_name"
                    required={showRequired}
                    value={values.task_name}
                    onChange={(e) => onChange("task_name", e.target.value)}
                    placeholder="Enter task name"
                    autoComplete="off"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="task_or_event">Type {showRequired && "*"}</Label>
                    <Select
                        id="task_or_event"
                        required={showRequired}
                        value={values.task_or_event}
                        onChange={(e) => onChange("task_or_event", e.target.value)}
                    >
                        <option value={TaskOrEvent.TASK}>Task</option>
                        <option value={TaskOrEvent.EVENT}>Event</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="task_type">Sub Type {showRequired && "*"}</Label>
                    <Select
                        id="task_type"
                        required={showRequired}
                        value={values.task_type}
                        onChange={(e) => onChange("task_type", e.target.value)}
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
                <Select id="status" value={values.status} onChange={(e) => onChange("status", e.target.value)}>
                    <option value={TaskStatus.OPEN}>Open</option>
                    <option value={TaskStatus.CLOSED}>Closed</option>
                    <option value={TaskStatus.BACKLOGGED}>Backlogged</option>
                </Select>
            </div>

            <div>
                <Label htmlFor="task_context">Context</Label>
                <Input
                    id="task_context"
                    value={values.task_context || ""}
                    onChange={(e) => onChange("task_context", e.target.value)}
                    placeholder="Add additional context..."
                    autoComplete="off"
                />
            </div>

            <div>
                <Label htmlFor="task_due_time">Due Date</Label>
                <Input
                    id="task_due_time"
                    type="datetime-local"
                    value={values.task_due_time || ""}
                    onChange={(e) => onChange("task_due_time", e.target.value)}
                />
            </div>

            {isEvent && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="event_start_time">Event Start</Label>
                        <Input
                            id="event_start_time"
                            type="datetime-local"
                            value={values.event_start_time || ""}
                            onChange={(e) => onChange("event_start_time", e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="event_end_time">Event End</Label>
                        <Input
                            id="event_end_time"
                            type="datetime-local"
                            value={values.event_end_time || ""}
                            onChange={(e) => onChange("event_end_time", e.target.value)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

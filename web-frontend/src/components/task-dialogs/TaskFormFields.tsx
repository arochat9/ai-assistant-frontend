import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { TaskStatus, TaskOrEvent, SubType, PlannedFor, Source } from "shared";

interface TaskFormFieldsProps {
    values: {
        taskName: string;
        subType: string;
        taskOrEvent: string;
        status: string;
        userNotes?: string;
        taskDueTime?: string;
        eventStartTime?: string;
        eventEndTime?: string;
        plannedFor?: string;
        source?: string;
        tags?: string[];
    };
    onChange: (field: string, value: string | string[]) => void;
    showRequired?: boolean;
}

export function TaskFormFields({ values, onChange, showRequired = false }: TaskFormFieldsProps) {
    const isEvent = values.taskOrEvent === TaskOrEvent.EVENT;

    return (
        <>
            <div>
                <Label htmlFor="taskName">Task Name {showRequired && "*"}</Label>
                <Input
                    id="taskName"
                    required={showRequired}
                    value={values.taskName}
                    onChange={(e) => onChange("taskName", e.target.value)}
                    placeholder="Enter task name"
                    autoComplete="off"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="taskOrEvent">Type {showRequired && "*"}</Label>
                    <Select
                        id="taskOrEvent"
                        required={showRequired}
                        value={values.taskOrEvent}
                        onChange={(e) => onChange("taskOrEvent", e.target.value)}
                    >
                        <option value={TaskOrEvent.TASK}>Task</option>
                        <option value={TaskOrEvent.EVENT}>Event</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="subType">Sub Type {showRequired && "*"}</Label>
                    <Select
                        id="subType"
                        required={showRequired}
                        value={values.subType}
                        onChange={(e) => onChange("subType", e.target.value)}
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

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="plannedFor">Planned For</Label>
                    <Select
                        id="plannedFor"
                        value={values.plannedFor || ""}
                        onChange={(e) => onChange("plannedFor", e.target.value)}
                    >
                        <option value="">Not planned</option>
                        <option value={PlannedFor.TODAY}>Today</option>
                        <option value={PlannedFor.TODAY_STRETCH_GOAL}>Today - Stretch Goal</option>
                        <option value={PlannedFor.TOMORROW}>Tomorrow</option>
                        <option value={PlannedFor.TOMORROW_STRETCH_GOAL}>Tomorrow - Stretch Goal</option>
                        <option value={PlannedFor.THIS_WEEK}>This Week</option>
                        <option value={PlannedFor.THIS_WEEK_STRETCH_GOAL}>This Week (Stretch Goal)</option>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="source">Source</Label>
                    <Select
                        id="source"
                        value={values.source || ""}
                        onChange={(e) => onChange("source", e.target.value)}
                    >
                        <option value="">Select source...</option>
                        <option value={Source.USER}>User</option>
                        <option value={Source.AGENT}>Agent</option>
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="userNotes">Notes</Label>
                <Input
                    id="userNotes"
                    value={values.userNotes || ""}
                    onChange={(e) => onChange("userNotes", e.target.value)}
                    placeholder="Add notes or context..."
                    autoComplete="off"
                />
            </div>

            <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                    id="tags"
                    value={values.tags?.join(", ") || ""}
                    onChange={(e) =>
                        onChange(
                            "tags",
                            e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean)
                        )
                    }
                    placeholder="work, urgent, personal..."
                    autoComplete="off"
                />
            </div>

            <div>
                <Label htmlFor="taskDueTime">Due Date</Label>
                <Input
                    id="taskDueTime"
                    type="datetime-local"
                    value={values.taskDueTime || ""}
                    onChange={(e) => onChange("taskDueTime", e.target.value)}
                />
            </div>

            {isEvent && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="eventStartTime">Event Start</Label>
                        <Input
                            id="eventStartTime"
                            type="datetime-local"
                            value={values.eventStartTime || ""}
                            onChange={(e) => onChange("eventStartTime", e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="eventEndTime">Event End</Label>
                        <Input
                            id="eventEndTime"
                            type="datetime-local"
                            value={values.eventEndTime || ""}
                            onChange={(e) => onChange("eventEndTime", e.target.value)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

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
        tags?: string;
    };
    onChange: (field: string, value: string) => void;
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
                        {Object.values(TaskOrEvent).map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
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
                        {Object.values(SubType).map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={values.status} onChange={(e) => onChange("status", e.target.value)}>
                    {Object.values(TaskStatus).map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
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
                        {Object.values(PlannedFor).map((plan) => (
                            <option key={plan} value={plan}>
                                {plan}
                            </option>
                        ))}
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
                        {Object.values(Source).map((src) => (
                            <option key={src} value={src}>
                                {src}
                            </option>
                        ))}
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
                    value={values.tags || ""}
                    onChange={(e) => onChange("tags", e.target.value)}
                    placeholder="work, urgent task, personal"
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

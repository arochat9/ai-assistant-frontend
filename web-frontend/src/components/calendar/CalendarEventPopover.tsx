import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { ExternalLink } from "lucide-react";
import type { CalendarEvent } from "../../utils/calendar";
import { EventApprovalStatus } from "shared";
import { format } from "date-fns";
import { TaskHistory } from "../task-drawer/TaskHistory";

interface CalendarEventPopoverProps {
    event: CalendarEvent;
    onUpdateTime?: (eventId: string, startTime: Date, endTime: Date, approvalStatus?: EventApprovalStatus) => void;
    onOpenDrawer?: () => void;
    onClose?: () => void;
}

export function CalendarEventPopover({ event, onUpdateTime, onOpenDrawer, onClose }: CalendarEventPopoverProps) {
    const [startTime, setStartTime] = useState(event.eventStartTime ? new Date(event.eventStartTime) : new Date());
    const [endTime, setEndTime] = useState(event.eventEndTime ? new Date(event.eventEndTime) : new Date());
    const [approvalStatus, setApprovalStatus] = useState<EventApprovalStatus | undefined>(event.eventApprovalStatus);

    const handleSave = () => {
        if (onUpdateTime) {
            onUpdateTime(event.taskId, startTime, endTime, approvalStatus);
        }
        onClose?.();
    };

    const handleCancel = () => {
        setStartTime(event.eventStartTime ? new Date(event.eventStartTime) : new Date());
        setEndTime(event.eventEndTime ? new Date(event.eventEndTime) : new Date());
        setApprovalStatus(event.eventApprovalStatus);
    };

    return (
        <div className="space-y-3 max-w-sm">
            <div className="max-h-96 overflow-y-auto space-y-3">
                <div>
                    <h3 className="font-semibold text-base mb-2">{event.taskName || "Untitled Event"}</h3>
                    <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                            {event.subType}
                        </Badge>
                        {event.eventApprovalStatus && (
                            <Badge
                                variant={event.eventApprovalStatus === "Pending" ? "secondary" : "default"}
                                className="text-xs"
                            >
                                {event.eventApprovalStatus}
                            </Badge>
                        )}
                        {event.source && (
                            <Badge variant="outline" className="text-xs">
                                {event.source}
                            </Badge>
                        )}
                    </div>
                </div>

                {event.taskContext && (
                    <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1">{event.taskContext}</p>
                    </div>
                )}

                {event.userNotes && (
                    <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <p className="text-sm mt-1">{event.userNotes}</p>
                    </div>
                )}

                {event.chats && event.chats.length > 0 && (
                    <div>
                        <Label className="text-xs text-muted-foreground">Chat(s)</Label>
                        <p className="text-sm mt-1">{event.chats.join(", ")}</p>
                    </div>
                )}

                <div className="border-t pt-3">
                    <TaskHistory taskId={event.taskId} />
                </div>
            </div>

            <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground">Quick Updates</Label>
                    {onOpenDrawer && (
                        <button
                            onClick={onOpenDrawer}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Details
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="popover-start-time" className="text-xs">
                                Start
                            </Label>
                            <Input
                                id="popover-start-time"
                                type="datetime-local"
                                value={format(startTime, "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => setStartTime(new Date(e.target.value))}
                                className="text-xs h-8"
                            />
                        </div>
                        <div>
                            <Label htmlFor="popover-end-time" className="text-xs">
                                End
                            </Label>
                            <Input
                                id="popover-end-time"
                                type="datetime-local"
                                value={format(endTime, "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => setEndTime(new Date(e.target.value))}
                                className="text-xs h-8"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label htmlFor="popover-approval-status" className="text-xs">
                                Approval
                            </Label>
                            <Select
                                id="popover-approval-status"
                                value={approvalStatus || ""}
                                onChange={(e) =>
                                    setApprovalStatus((e.target.value as EventApprovalStatus) || undefined)
                                }
                                className="text-xs h-8"
                            >
                                <option value="">Select...</option>
                                {Object.values(EventApprovalStatus).map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <Button size="sm" onClick={handleSave} className="h-8 text-xs px-3">
                            Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 text-xs px-3">
                            Reset
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

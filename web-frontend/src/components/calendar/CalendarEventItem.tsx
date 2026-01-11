import { EventApprovalStatus } from "shared";
import type { CalendarEvent } from "../../utils/calendar";
import { formatEventTime } from "../../utils/calendar";

interface CalendarEventItemProps {
    event: CalendarEvent;
    onClick: (event: CalendarEvent) => void;
}

export function CalendarEventItem({ event, onClick }: CalendarEventItemProps) {
    const getEventStyles = () => {
        if (event.isRejected) {
            return "bg-destructive/10 border-destructive/20 text-destructive line-through";
        }

        if (event.eventApprovalStatus === EventApprovalStatus.PENDING) {
            return "bg-yellow-50 border-yellow-200 text-yellow-900 border-dashed";
        }

        return "bg-primary/10 border-primary/20 text-primary";
    };

    return (
        <button
            onClick={() => onClick(event)}
            className={`w-full text-left px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getEventStyles()}`}
        >
            <div className="font-medium truncate">{event.taskName || "Untitled Event"}</div>
            <div className="text-[10px] opacity-75">{formatEventTime(event)}</div>
        </button>
    );
}

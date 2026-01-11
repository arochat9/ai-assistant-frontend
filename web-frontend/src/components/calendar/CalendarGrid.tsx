import type { CalendarEvent, ViewMode } from "../../utils/calendar";
import { getWeekDays, getMonthDays, isSameDay, isInMonth, getEventsForDay } from "../../utils/calendar";
import { CalendarEventItem } from "./CalendarEventItem";

interface CalendarGridProps {
    currentDate: Date;
    viewMode: ViewMode;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({ currentDate, viewMode, events, onEventClick }: CalendarGridProps) {
    const days = viewMode === "week" ? getWeekDays(currentDate) : getMonthDays(currentDate);
    const today = new Date();

    const renderDay = (day: Date) => {
        const dayEvents = getEventsForDay(events, day);
        const isToday = isSameDay(day, today);
        const isCurrentMonth = viewMode === "week" || isInMonth(day, currentDate);

        return (
            <div
                key={day.toISOString()}
                className={`overflow-y-auto relative ${
                    !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"
                } ${isToday ? "border-2 border-blue-400 rounded-md" : "border"}`}
            >
                <div className="p-2">
                    <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600" : ""}`}>{day.getDate()}</div>
                    <div className="space-y-1">
                        {dayEvents.map((event) => (
                            <CalendarEventItem key={event.taskId} event={event} onClick={onEventClick} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-0">
            {/* Weekday headers */}
            <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} bg-muted/50`}>
                {WEEKDAYS.map((day) => (
                    <div key={day} className="p-2 text-sm font-semibold text-center border-b">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div
                className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} flex-1 min-h-0 ${
                    viewMode === "month" ? "grid-rows-5" : ""
                }`}
            >
                {days.map((day) => renderDay(day))}
            </div>
        </div>
    );
}

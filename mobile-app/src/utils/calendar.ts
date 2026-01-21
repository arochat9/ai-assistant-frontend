import { Task, TaskStatus, TaskOrEvent, EventApprovalStatus } from "../types";

export type ViewMode = "day" | "week" | "month";

export interface CalendarEvent extends Task {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    isRejected: boolean;
}

export function taskToCalendarEvent(task: Task): CalendarEvent | null {
    if (task.taskOrEvent !== TaskOrEvent.EVENT || !task.eventStartTime || !task.eventEndTime) {
        return null;
    }

    const startDate = new Date(task.eventStartTime);
    const endDate = new Date(task.eventEndTime);

    const isAllDay =
        startDate.getUTCHours() === 0 &&
        startDate.getUTCMinutes() === 0 &&
        startDate.getUTCSeconds() === 0 &&
        endDate.getUTCHours() === 23 &&
        endDate.getUTCMinutes() === 59 &&
        endDate.getUTCSeconds() === 59;

    const isRejected = task.status === TaskStatus.CLOSED && endDate > new Date();

    return {
        ...task,
        startDate,
        endDate,
        isAllDay,
        isRejected,
    };
}

export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

export function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59);
}

export function getWeekDays(date: Date): Date[] {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });
}

export function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

export function getMonthDays(date: Date): Date[] {
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);

    const startDay = monthStart.getDay();
    const startDayMonday = startDay === 0 ? 6 : startDay - 1;
    const endDay = monthEnd.getDay();
    const endDayMonday = endDay === 0 ? 6 : endDay - 1;

    const days: Date[] = [];

    for (let i = startDayMonday - 1; i >= 0; i--) {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() - i - 1);
        days.push(day);
    }

    for (let i = 1; i <= monthEnd.getDate(); i++) {
        days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    for (let i = 1; i < 7 - endDayMonday; i++) {
        const day = new Date(monthEnd);
        day.setDate(monthEnd.getDate() + i);
        days.push(day);
    }

    return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export function isInMonth(date: Date, monthDate: Date): boolean {
    return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
    const filteredEvents = events.filter((event) => {
        if (event.isAllDay) {
            const eventStartUTC = new Date(
                Date.UTC(event.startDate.getUTCFullYear(), event.startDate.getUTCMonth(), event.startDate.getUTCDate())
            );
            const eventEndUTC = new Date(
                Date.UTC(event.endDate.getUTCFullYear(), event.endDate.getUTCMonth(), event.endDate.getUTCDate())
            );
            const dayUTC = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));

            return eventStartUTC <= dayUTC && dayUTC <= eventEndUTC;
        }

        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);

        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return eventStart <= dayEnd && eventEnd >= dayStart;
    });

    return filteredEvents.sort((a, b) => {
        if (a.isRejected && !b.isRejected) return 1;
        if (!a.isRejected && b.isRejected) return -1;
        return a.startDate.getTime() - b.startDate.getTime();
    });
}

export function formatEventTime(event: CalendarEvent): string {
    if (event.isAllDay) {
        return "All day";
    }

    const start = event.startDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

    return start;
}

export function isMultiDayEvent(event: CalendarEvent): boolean {
    // For all-day events, compare UTC dates to avoid timezone issues
    if (event.isAllDay) {
        const startUTC = Date.UTC(
            event.startDate.getUTCFullYear(),
            event.startDate.getUTCMonth(),
            event.startDate.getUTCDate()
        );
        const endUTC = Date.UTC(
            event.endDate.getUTCFullYear(),
            event.endDate.getUTCMonth(),
            event.endDate.getUTCDate()
        );
        return startUTC !== endUTC;
    }

    // For timed events, compare local dates
    const startDay = new Date(event.startDate);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(event.endDate);
    endDay.setHours(0, 0, 0, 0);
    return startDay.getTime() !== endDay.getTime();
}

export interface SpanningEvent {
    event: CalendarEvent;
    startCol: number;
    endCol: number;
    isStartOfEvent: boolean;
    isEndOfEvent: boolean;
}

function getEventDayTimestamp(event: CalendarEvent, date: Date, useStart: boolean): number {
    if (event.isAllDay) {
        const d = useStart ? event.startDate : event.endDate;
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    const d = new Date(useStart ? event.startDate : event.endDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function getDayTimestamp(day: Date): number {
    return new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
}

export function getSpanningEventsForRow(events: CalendarEvent[], rowDays: Date[]): SpanningEvent[] {
    if (rowDays.length === 0) return [];

    const rowStartTs = getDayTimestamp(rowDays[0]);
    const rowEndTs = getDayTimestamp(rowDays[rowDays.length - 1]);

    const spanningEvents: SpanningEvent[] = [];

    for (const event of events) {
        if (!isMultiDayEvent(event)) continue;

        const eventStartTs = getEventDayTimestamp(event, event.startDate, true);
        const eventEndTs = getEventDayTimestamp(event, event.endDate, false);

        // Check if event overlaps with this row
        if (eventEndTs < rowStartTs || eventStartTs > rowEndTs) continue;

        // Find start column (0-6)
        let startCol = 0;
        if (eventStartTs <= rowStartTs) {
            startCol = 0;
        } else {
            for (let i = 0; i < rowDays.length; i++) {
                const dayTs = getDayTimestamp(rowDays[i]);
                if (dayTs >= eventStartTs) {
                    startCol = i;
                    break;
                }
            }
        }

        // Find end column (0-6)
        let endCol = rowDays.length - 1;
        if (eventEndTs >= rowEndTs) {
            endCol = rowDays.length - 1;
        } else {
            for (let i = rowDays.length - 1; i >= 0; i--) {
                const dayTs = getDayTimestamp(rowDays[i]);
                if (dayTs <= eventEndTs) {
                    endCol = i;
                    break;
                }
            }
        }

        const isStartOfEvent = eventStartTs >= rowStartTs && eventStartTs <= rowEndTs;
        const isEndOfEvent = eventEndTs >= rowStartTs && eventEndTs <= rowEndTs;

        spanningEvents.push({
            event,
            startCol,
            endCol,
            isStartOfEvent,
            isEndOfEvent,
        });
    }

    // Sort by start column, then by event duration (longer events first)
    return spanningEvents.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol;
        const aDuration = a.endCol - a.startCol;
        const bDuration = b.endCol - b.startCol;
        return bDuration - aDuration;
    });
}

export function getSingleDayEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
    return getEventsForDay(events, day).filter(e => !isMultiDayEvent(e));
}

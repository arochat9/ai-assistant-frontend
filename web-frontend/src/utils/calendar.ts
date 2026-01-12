import type { Task } from "shared";
import { TaskStatus, EventApprovalStatus, TaskOrEvent } from "shared";

export type ViewMode = "week" | "month";

export interface CalendarEvent extends Task {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    isRejected: boolean;
}

/**
 * Convert a Task to a CalendarEvent with computed properties
 */
export function taskToCalendarEvent(task: Task): CalendarEvent | null {
    if (task.taskOrEvent !== TaskOrEvent.EVENT || !task.eventStartTime || !task.eventEndTime) {
        return null;
    }

    const startDate = new Date(task.eventStartTime);
    const endDate = new Date(task.eventEndTime);

    // Check if it's an all-day event (stored as 00:00:00 UTC to 23:59:59 UTC)
    const isAllDay =
        startDate.getUTCHours() === 0 &&
        startDate.getUTCMinutes() === 0 &&
        startDate.getUTCSeconds() === 0 &&
        endDate.getUTCHours() === 23 &&
        endDate.getUTCMinutes() === 59 &&
        endDate.getUTCSeconds() === 59;

    // Event is rejected if it's in the future and status is Closed
    const isRejected = task.status === TaskStatus.CLOSED && endDate > new Date();

    return {
        ...task,
        startDate,
        endDate,
        isAllDay,
        isRejected,
    };
}

/**
 * Get the start of week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days, otherwise go to Monday
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

/**
 * Get the end of week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59);
}

/**
 * Get all days in a week starting from the given date
 */
export function getWeekDays(date: Date): Date[] {
    const start = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });
}

/**
 * Get the start of month
 */
export function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of month
 */
export function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

/**
 * Get all days to display in a month view (including padding days from prev/next month)
 */
export function getMonthDays(date: Date): Date[] {
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);

    // Convert Sunday=0 to Monday=0 system
    const startDay = monthStart.getDay();
    const startDayMonday = startDay === 0 ? 6 : startDay - 1;
    const endDay = monthEnd.getDay();
    const endDayMonday = endDay === 0 ? 6 : endDay - 1;

    const days: Date[] = [];

    // Add padding days from previous month (to get to Monday)
    for (let i = startDayMonday - 1; i >= 0; i--) {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() - i - 1);
        days.push(day);
    }

    // Add days of current month
    for (let i = 1; i <= monthEnd.getDate(); i++) {
        days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    // Add padding days from next month (to get to Sunday)
    for (let i = 1; i < 7 - endDayMonday; i++) {
        const day = new Date(monthEnd);
        day.setDate(monthEnd.getDate() + i);
        days.push(day);
    }

    return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * Check if a date is in the current month
 */
export function isInMonth(date: Date, monthDate: Date): boolean {
    return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

/**
 * Filter events for a specific day and sort them with canceled events at the bottom
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
    const filteredEvents = events.filter((event) => {
        // For all-day events, use UTC date to avoid timezone issues
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

        // For timed events, use local time
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

    // Sort events: non-rejected first, then by start time, with rejected events at the bottom
    return filteredEvents.sort((a, b) => {
        // Rejected events go to bottom
        if (a.isRejected && !b.isRejected) return 1;
        if (!a.isRejected && b.isRejected) return -1;

        // Both same rejection status, sort by start time
        return a.startDate.getTime() - b.startDate.getTime();
    });
}

/**
 * Format time for display
 */
export function formatEventTime(event: CalendarEvent): string {
    if (event.isAllDay) {
        return "All day";
    }

    const start = event.startDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

    const end = event.endDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

    return `${start} - ${end}`;
}

/**
 * Get the event display status classes
 */
export function getEventClassName(event: CalendarEvent): string {
    const baseClass = "calendar-event";

    if (event.isRejected) {
        return `${baseClass} event-rejected`;
    }

    if (event.eventApprovalStatus === EventApprovalStatus.PENDING) {
        return `${baseClass} event-pending`;
    }

    return `${baseClass} event-approved`;
}

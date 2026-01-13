import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "../services/api";
import { CalendarHeader } from "../components/calendar/CalendarHeader";
import { CalendarGrid } from "../components/calendar/CalendarGrid";
import { useTaskDrawer } from "../contexts/TaskDrawerContext";
import { useTaskDialog } from "../contexts/TaskDialogContext";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { TaskOrEvent, EventApprovalStatus } from "shared";
import type { ViewMode, CalendarEvent } from "../utils/calendar";
import { taskToCalendarEvent, getMonthStart, getWeekStart, getWeekEnd } from "../utils/calendar";
import { toast } from "sonner";

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const { openDrawer } = useTaskDrawer();
    const { openCreateDialog } = useTaskDialog();
    const queryClient = useQueryClient();

    const { updateMutation } = useTaskMutations({});

    // Calculate date range based on current view - load 4 months for month view
    const dateRange = useMemo(() => {
        if (viewMode === "week") {
            return {
                start: getWeekStart(currentDate),
                end: getWeekEnd(currentDate),
            };
        }
        // For month view, load current month + 3 months ahead (4 months total)
        const monthStart = getMonthStart(currentDate);
        const fourMonthsAhead = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0);
        return {
            start: getWeekStart(monthStart),
            end: getWeekEnd(fourMonthsAhead),
        };
    }, [currentDate, viewMode]);

    // Fetch only events within the visible date range
    const { data, isLoading, error } = useQuery({
        queryKey: [
            "tasks",
            { taskOrEvent: TaskOrEvent.EVENT, eventStartBefore: dateRange.end, eventEndAfter: dateRange.start },
        ],
        queryFn: () =>
            tasksApi.getTasks({
                taskOrEvent: TaskOrEvent.EVENT,
                eventStartBefore: dateRange.end,
                eventEndAfter: dateRange.start,
            }),
    });

    // Convert tasks to calendar events
    const events = useMemo<CalendarEvent[]>(() => {
        if (!data?.tasks) return [];
        return data.tasks.map(taskToCalendarEvent).filter((event): event is CalendarEvent => event !== null);
    }, [data]);

    const handlePrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() - 7);
        } else {
            newDate.setMonth(currentDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() + 7);
        } else {
            newDate.setMonth(currentDate.getMonth() + 1);

            // Prefetch next 4 months for month view
            const nextMonthStart = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1);
            const nextMonthEnd = new Date(newDate.getFullYear(), newDate.getMonth() + 5, 0);
            const prefetchRange = {
                start: getWeekStart(nextMonthStart),
                end: getWeekEnd(nextMonthEnd),
            };

            queryClient.prefetchQuery({
                queryKey: [
                    "tasks",
                    {
                        taskOrEvent: TaskOrEvent.EVENT,
                        eventStartBefore: prefetchRange.end,
                        eventEndAfter: prefetchRange.start,
                    },
                ],
                queryFn: () =>
                    tasksApi.getTasks({
                        taskOrEvent: TaskOrEvent.EVENT,
                        eventStartBefore: prefetchRange.end,
                        eventEndAfter: prefetchRange.start,
                    }),
            });
        }
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventClick = (event: CalendarEvent) => {
        openDrawer(event);
    };

    const handleCreateEvent = () => {
        openCreateDialog();
    };

    const handleUpdateTime = (
        eventId: string,
        startTime: Date,
        endTime: Date,
        approvalStatus?: EventApprovalStatus
    ) => {
        const event = events.find((e) => e.taskId === eventId);
        if (!event) {
            toast.error("Event not found");
            return;
        }

        updateMutation.mutate({
            taskId: eventId,
            taskName: event.taskName,
            taskOrEvent: event.taskOrEvent,
            subType: event.subType,
            status: event.status,
            eventStartTime: startTime,
            eventEndTime: endTime,
            eventApprovalStatus: approvalStatus,
        });
    };

    return (
        <div className="h-full p-4 flex flex-col">
            <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onToday={handleToday}
                onViewModeChange={setViewMode}
                onCreateEvent={handleCreateEvent}
                eventCount={events.length}
            />

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-muted-foreground">Loading events...</p>
                </div>
            ) : error ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-destructive">Error loading events: {error.message}</p>
                </div>
            ) : (
                <CalendarGrid
                    currentDate={currentDate}
                    viewMode={viewMode}
                    events={events}
                    onEventClick={handleEventClick}
                    onUpdateTime={handleUpdateTime}
                />
            )}
        </div>
    );
}

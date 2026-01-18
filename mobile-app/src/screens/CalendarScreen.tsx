import React, { useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tasksApi } from "../services/api";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { TaskOrEvent, EventApprovalStatus } from "../types";
import {
    ViewMode,
    CalendarEvent,
    taskToCalendarEvent,
    getMonthDays,
    getWeekDays,
    getWeekStart,
    getWeekEnd,
    getMonthStart,
    isSameDay,
    isInMonth,
    getEventsForDay,
    formatEventTime,
} from "../utils/calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const dateRange = useMemo(() => {
        if (viewMode === "week") {
            return {
                start: getWeekStart(currentDate),
                end: getWeekEnd(currentDate),
            };
        }
        const monthStart = getMonthStart(currentDate);
        const fourMonthsAhead = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0);
        return {
            start: getWeekStart(monthStart),
            end: getWeekEnd(fourMonthsAhead),
        };
    }, [currentDate, viewMode]);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [
            "events",
            { taskOrEvent: TaskOrEvent.EVENT, eventStartBefore: dateRange.end, eventEndAfter: dateRange.start },
        ],
        queryFn: () =>
            tasksApi.getTasks({
                taskOrEvent: TaskOrEvent.EVENT,
                eventStartBefore: dateRange.end,
                eventEndAfter: dateRange.start,
            }),
    });

    const events = useMemo<CalendarEvent[]>(() => {
        if (!data?.tasks) return [];
        return data.tasks.map(taskToCalendarEvent).filter((event): event is CalendarEvent => event !== null);
    }, [data]);

    const days = useMemo(() => {
        return viewMode === "week" ? getWeekDays(currentDate) : getMonthDays(currentDate);
    }, [currentDate, viewMode]);

    const dayEvents = useMemo(() => {
        if (!selectedDay) return [];
        return getEventsForDay(events, selectedDay);
    }, [events, selectedDay]);

    const handlePrevious = useCallback(() => {
        if (viewMode === "day" && selectedDay) {
            const newDate = new Date(selectedDay);
            newDate.setDate(selectedDay.getDate() - 1);
            setSelectedDay(newDate);
            return;
        }
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() - 7);
        } else {
            newDate.setMonth(currentDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    }, [currentDate, viewMode, selectedDay]);

    const handleNext = useCallback(() => {
        if (viewMode === "day" && selectedDay) {
            const newDate = new Date(selectedDay);
            newDate.setDate(selectedDay.getDate() + 1);
            setSelectedDay(newDate);
            return;
        }
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() + 7);
        } else {
            newDate.setMonth(currentDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    }, [currentDate, viewMode, selectedDay]);

    const handleToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        if (viewMode === "day") {
            setSelectedDay(today);
        }
    }, [viewMode]);

    const handleDayPress = useCallback((day: Date) => {
        setSelectedDay(day);
        setViewMode("day");
    }, []);

    const handleEventPress = useCallback((event: CalendarEvent) => {
        navigation.navigate("CalendarDetail", { task: event });
    }, [navigation]);

    const handleBackToMonth = useCallback(() => {
        if (selectedDay) {
            setCurrentDate(selectedDay);
        }
        setViewMode("month");
        setSelectedDay(null);
    }, [selectedDay]);

    const today = new Date();

    const getEventColor = (event: CalendarEvent) => {
        if (event.isRejected) return colors.error;
        if (event.eventApprovalStatus === EventApprovalStatus.PENDING) return colors.warning;
        return colors.primary;
    };

    const headerTitle = useMemo(() => {
        if (viewMode === "day" && selectedDay) {
            return selectedDay.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
            });
        }
        return currentDate.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
        });
    }, [viewMode, selectedDay, currentDate]);

    const renderCalendarEvent = (event: CalendarEvent) => (
        <View
            key={event.taskId}
            style={[styles.calendarEvent, { backgroundColor: getEventColor(event) + "30", borderLeftColor: getEventColor(event) }]}
        >
            <Text style={styles.calendarEventTime}>{formatEventTime(event)}</Text>
            <Text style={[styles.calendarEventName, event.isRejected && styles.eventRejected]} numberOfLines={1}>
                {event.taskName}
            </Text>
        </View>
    );

    const renderDay = (day: Date) => {
        const eventsForDay = getEventsForDay(events, day);
        const isToday = isSameDay(day, today);
        const isCurrentMonth = viewMode === "week" || isInMonth(day, currentDate);

        return (
            <Pressable
                style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayCellOtherMonth,
                    isToday && styles.dayCellToday,
                ]}
                onPress={() => handleDayPress(day)}
            >
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday, !isCurrentMonth && styles.dayNumberOther]}>
                    {day.getDate()}
                </Text>
                <View style={styles.dayEvents}>
                    {eventsForDay.slice(0, 3).map(renderCalendarEvent)}
                    {eventsForDay.length > 3 && (
                        <Text style={styles.moreEvents}>+{eventsForDay.length - 3} more</Text>
                    )}
                </View>
            </Pressable>
        );
    };

    const renderDayViewEvent = (event: CalendarEvent) => (
        <Pressable
            key={event.taskId}
            style={[styles.dayViewEvent, { borderLeftColor: getEventColor(event) }]}
            onPress={() => handleEventPress(event)}
        >
            <Text style={styles.dayViewEventTime}>{formatEventTime(event)}</Text>
            <Text style={[styles.dayViewEventName, event.isRejected && styles.eventRejected]} numberOfLines={2}>
                {event.taskName}
            </Text>
            {event.isRejected && <Text style={styles.rejectedLabel}>Declined</Text>}
            {event.eventApprovalStatus === EventApprovalStatus.PENDING && (
                <Text style={styles.pendingLabel}>Pending</Text>
            )}
        </Pressable>
    );

    // Group days into rows of 7
    const rows = useMemo(() => {
        const result: Date[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            result.push(days.slice(i, i + 7));
        }
        return result;
    }, [days]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Calendar</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Calendar</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load events</Text>
                    <Pressable style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // Day View
    if (viewMode === "day" && selectedDay) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Pressable onPress={handleBackToMonth} hitSlop={8}>
                            <Text style={styles.backButton}>← Back</Text>
                        </Pressable>
                        <Text style={styles.eventCount}>{dayEvents.length} events</Text>
                    </View>
                    <Text style={styles.dayViewTitle}>{headerTitle}</Text>
                    <View style={styles.headerControls}>
                        <View style={styles.navButtons}>
                            <Pressable style={styles.navButton} onPress={handlePrevious}>
                                <Text style={styles.navButtonText}>‹</Text>
                            </Pressable>
                            <Pressable style={styles.todayButton} onPress={handleToday}>
                                <Text style={styles.todayButtonText}>Today</Text>
                            </Pressable>
                            <Pressable style={styles.navButton} onPress={handleNext}>
                                <Text style={styles.navButtonText}>›</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <ScrollView style={styles.dayViewContent} contentContainerStyle={styles.dayViewContentContainer}>
                    {dayEvents.length === 0 ? (
                        <View style={styles.noEventsContainer}>
                            <Text style={styles.noEventsText}>No events this day</Text>
                        </View>
                    ) : (
                        dayEvents.map(renderDayViewEvent)
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Month/Week View
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{headerTitle}</Text>
                    <Text style={styles.eventCount}>{events.length} events</Text>
                </View>
                <View style={styles.headerControls}>
                    <View style={styles.navButtons}>
                        <Pressable style={styles.navButton} onPress={handlePrevious}>
                            <Text style={styles.navButtonText}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.todayButton} onPress={handleToday}>
                            <Text style={styles.todayButtonText}>Today</Text>
                        </Pressable>
                        <Pressable style={styles.navButton} onPress={handleNext}>
                            <Text style={styles.navButtonText}>›</Text>
                        </Pressable>
                    </View>
                    <View style={styles.viewToggle}>
                        <Pressable
                            style={[styles.viewButton, viewMode === "week" && styles.viewButtonActive]}
                            onPress={() => setViewMode("week")}
                        >
                            <Text style={[styles.viewButtonText, viewMode === "week" && styles.viewButtonTextActive]}>Week</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.viewButton, viewMode === "month" && styles.viewButtonActive]}
                            onPress={() => setViewMode("month")}
                        >
                            <Text style={[styles.viewButtonText, viewMode === "month" && styles.viewButtonTextActive]}>Month</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekdayHeader}>
                {WEEKDAYS.map((day) => (
                    <View key={day} style={styles.weekdayCell}>
                        <Text style={styles.weekdayText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.weekRow}>
                        {row.map((day, dayIndex) => (
                            <View key={dayIndex} style={styles.dayCellWrapper}>
                                {renderDay(day)}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        marginBottom: spacing.sm,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
    },
    eventCount: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    headerControls: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
    },
    navButtons: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },
    navButton: {
        width: 36,
        height: 32,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
    },
    navButtonText: {
        fontSize: 20,
        color: colors.text,
    },
    todayButton: {
        paddingHorizontal: spacing.md,
        height: 32,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        marginHorizontal: spacing.xs,
    },
    todayButtonText: {
        fontSize: fontSize.sm,
        color: colors.text,
    },
    viewToggle: {
        flexDirection: "row" as const,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        padding: 2,
    },
    viewButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    viewButtonActive: {
        backgroundColor: colors.primary,
    },
    viewButtonText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    viewButtonTextActive: {
        color: colors.text,
        fontWeight: "500" as const,
    },
    centered: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    errorText: {
        color: colors.error,
        marginBottom: spacing.md,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    retryButtonText: {
        color: colors.text,
        fontWeight: "500" as const,
    },
    weekdayHeader: {
        flexDirection: "row" as const,
        backgroundColor: colors.surface,
    },
    weekdayCell: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: "center" as const,
    },
    weekdayText: {
        fontSize: fontSize.xs,
        fontWeight: "600" as const,
        color: colors.textSecondary,
    },
    calendarGrid: {
        flex: 1,
    },
    weekRow: {
        flex: 1,
        flexDirection: "row" as const,
    },
    dayCellWrapper: {
        flex: 1,
    },
    dayCell: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        padding: 4,
    },
    dayCellOtherMonth: {
        backgroundColor: colors.surface,
    },
    dayCellToday: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    dayNumber: {
        fontSize: fontSize.sm,
        fontWeight: "500" as const,
        color: colors.text,
        marginBottom: 2,
    },
    dayNumberToday: {
        color: colors.primary,
        fontWeight: "700" as const,
    },
    dayNumberOther: {
        color: colors.textMuted,
    },
    dayEvents: {
        flex: 1,
        overflow: "hidden" as const,
    },
    calendarEvent: {
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 2,
        marginBottom: 1,
        borderLeftWidth: 2,
    },
    calendarEventTime: {
        fontSize: 8,
        color: colors.textMuted,
    },
    calendarEventName: {
        fontSize: 9,
        color: colors.text,
    },
    moreEvents: {
        fontSize: 8,
        color: colors.textMuted,
        fontStyle: "italic" as const,
    },
    // Day view styles
    backButton: {
        fontSize: fontSize.md,
        color: colors.primary,
    },
    dayViewTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    dayViewContent: {
        flex: 1,
    },
    dayViewContentContainer: {
        padding: spacing.md,
    },
    noEventsContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        paddingVertical: spacing.xxl,
    },
    noEventsText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
    },
    dayViewEvent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderLeftWidth: 4,
    },
    dayViewEventTime: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    dayViewEventName: {
        fontSize: fontSize.md,
        fontWeight: "500" as const,
        color: colors.text,
    },
    eventRejected: {
        textDecorationLine: "line-through" as const,
        color: colors.textMuted,
    },
    rejectedLabel: {
        fontSize: fontSize.xs,
        color: colors.error,
        marginTop: spacing.xs,
    },
    pendingLabel: {
        fontSize: fontSize.xs,
        color: colors.warning,
        marginTop: spacing.xs,
    },
});

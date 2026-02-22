import React, { useState, useMemo, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Pressable,
    ActivityIndicator,
    ScrollView,
    Animated,
    RefreshControl,
    PanResponder,
} from "react-native";
import { BottomSheet } from "../components/BottomSheet";
import { BottomSheetOption } from "../components/BottomSheetOption";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tasksApi } from "../services/api";
import { useTaskMutations } from "../hooks/useTaskMutations";
import { colors, spacing, fontSize, borderRadius } from "../theme";
import { TaskOrEvent, EventApprovalStatus, TaskStatus } from "../types";
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
    getSpanningEventsForRow,
    getSingleDayEventsForDay,
    isMultiDayEvent,
    SpanningEvent,
} from "../utils/calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Event background colors (event color blended with dark background)
const EVENT_BG_COLORS = {
    primary: "#1d1e42", // colors.primary blended
    warning: "#3d2a0a", // colors.warning blended
    error: "#3f1616", // colors.error blended
};

export function CalendarScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastOpacity = useRef(new Animated.Value(0)).current;
    const toastTranslateY = useRef(new Animated.Value(-20)).current;

    const showToast = useCallback(
        (message: string) => {
            setToastMessage(message);
            toastTranslateY.setValue(-20);
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                    Animated.timing(toastTranslateY, { toValue: 0, duration: 150, useNativeDriver: true }),
                ]),
                Animated.delay(1500),
                Animated.parallel([
                    Animated.timing(toastOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                    Animated.timing(toastTranslateY, { toValue: -20, duration: 150, useNativeDriver: true }),
                ]),
            ]).start(() => setToastMessage(null));
        },
        [toastOpacity, toastTranslateY],
    );

    const { updateMutation } = useTaskMutations({
        onUpdateSuccess: () => showToast("Event updated"),
    });

    const dateRange = useMemo(() => {
        if (viewMode === "week") {
            return {
                start: getWeekStart(currentDate),
                end: getWeekEnd(currentDate),
            };
        }
        const monthStart = getMonthStart(currentDate);
        const twoMonthsAhead = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
        return {
            start: getWeekStart(monthStart),
            end: getWeekEnd(twoMonthsAhead),
        };
    }, [currentDate, viewMode]);

    // Refs to hold latest navigation handlers (avoids stale closures in PanResponder)
    const handlePreviousRef = useRef(() => {});
    const handleNextRef = useRef(() => {});
    const handleBackToMonthRef = useRef(() => {});

    // Swipe gesture for month/week navigation
    const swipeThreshold = 50;
    const monthPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > swipeThreshold) {
                    handlePreviousRef.current();
                } else if (gestureState.dx < -swipeThreshold) {
                    handleNextRef.current();
                }
            },
        }),
    ).current;

    // Swipe gesture for day view (back to month)
    const dayPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                gestureState.dx > 20 && Math.abs(gestureState.dy) < 50,
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > swipeThreshold) {
                    handleBackToMonthRef.current();
                }
            },
        }),
    ).current;

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
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

    const handleEventPress = useCallback(
        (event: CalendarEvent) => {
            navigation.navigate("CalendarDetail", { task: event });
        },
        [navigation],
    );

    const handleBackToMonth = useCallback(() => {
        if (selectedDay) {
            setCurrentDate(selectedDay);
        }
        setViewMode("month");
        setSelectedDay(null);
    }, [selectedDay]);

    // Keep refs updated with latest handlers
    handlePreviousRef.current = handlePrevious;
    handleNextRef.current = handleNext;
    handleBackToMonthRef.current = handleBackToMonth;

    const today = new Date();

    const getEventColors = (event: CalendarEvent) => {
        if (event.isRejected) return { border: colors.error, bg: EVENT_BG_COLORS.error };
        if (event.eventApprovalStatus === EventApprovalStatus.PENDING)
            return { border: colors.warning, bg: EVENT_BG_COLORS.warning };
        return { border: colors.primary, bg: EVENT_BG_COLORS.primary };
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

    const renderCalendarEvent = (event: CalendarEvent) => {
        const { border, bg } = getEventColors(event);
        return (
            <View key={event.taskId} style={[styles.calendarEvent, { backgroundColor: bg, borderLeftColor: border }]}>
                <Text style={[styles.calendarEventName, event.isRejected && styles.eventRejected]} numberOfLines={1}>
                    {event.taskName}
                </Text>
            </View>
        );
    };

    const renderSpanningEvent = (spanningEvent: SpanningEvent, index: number) => {
        const { event, startCol, endCol, isStartOfEvent, isEndOfEvent } = spanningEvent;
        const { border, bg } = getEventColors(event);
        const span = endCol - startCol + 1;
        const leftPercent = (startCol / 7) * 100;
        const widthPercent = (span / 7) * 100;

        return (
            <View
                key={`${event.taskId}-${startCol}`}
                style={[
                    styles.spanningEvent,
                    {
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        top: index * 18,
                        backgroundColor: colors.background,
                    },
                    isStartOfEvent && styles.spanningEventStart,
                    isEndOfEvent && styles.spanningEventEnd,
                ]}
            >
                <View style={[styles.spanningEventInner, { backgroundColor: bg, borderLeftColor: border }]}>
                    <Text
                        style={[styles.spanningEventName, event.isRejected && styles.eventRejected]}
                        numberOfLines={1}
                    >
                        {event.taskName}
                    </Text>
                </View>
            </View>
        );
    };

    const renderDay = (day: Date, spanningEventCount: number) => {
        const singleDayEvents = getSingleDayEventsForDay(events, day);
        const isToday = isSameDay(day, today);
        const isCurrentMonth = viewMode === "week" || isInMonth(day, currentDate);
        const maxSingleDayEvents = Math.max(0, 3 - spanningEventCount);

        return (
            <Pressable
                style={[styles.dayCell, !isCurrentMonth && styles.dayCellOtherMonth, isToday && styles.dayCellToday]}
                onPress={() => handleDayPress(day)}
            >
                <Text
                    style={[
                        styles.dayNumber,
                        isToday && styles.dayNumberToday,
                        !isCurrentMonth && styles.dayNumberOther,
                    ]}
                >
                    {day.getDate()}
                </Text>
                {spanningEventCount > 0 && <View style={{ height: spanningEventCount * 18 }} />}
                <View style={styles.dayEvents}>
                    {singleDayEvents.slice(0, maxSingleDayEvents).map(renderCalendarEvent)}
                    {singleDayEvents.length > maxSingleDayEvents && (
                        <Text style={styles.moreEvents}>+{singleDayEvents.length - maxSingleDayEvents} more</Text>
                    )}
                </View>
            </Pressable>
        );
    };

    const formatDayViewTime = (event: CalendarEvent): string => {
        if (isMultiDayEvent(event)) {
            const startStr = event.startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            const endStr = event.endDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return `${startStr} – ${endStr}`;
        }
        return formatEventTime(event);
    };

    const handleStatusChange = (newStatus: "closed" | "pending" | "approved") => {
        if (!editingEvent) return;

        const updates: { status?: TaskStatus; eventApprovalStatus?: EventApprovalStatus } = {};

        if (newStatus === "closed") {
            updates.status = TaskStatus.CLOSED;
        } else {
            // If currently closed, open it
            if (editingEvent.status === TaskStatus.CLOSED) {
                updates.status = TaskStatus.OPEN;
            }
            updates.eventApprovalStatus =
                newStatus === "pending" ? EventApprovalStatus.PENDING : EventApprovalStatus.APPROVED;
        }

        updateMutation.mutate({
            taskId: editingEvent.taskId,
            taskName: editingEvent.taskName,
            taskOrEvent: editingEvent.taskOrEvent,
            subType: editingEvent.subType,
            status: updates.status ?? editingEvent.status,
            eventApprovalStatus: updates.eventApprovalStatus ?? editingEvent.eventApprovalStatus,
        });

        setEditingEvent(null);
    };

    const renderToast = () => {
        if (!toastMessage) return null;
        return (
            <Animated.View
                style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }]}
            >
                <View style={styles.toastDot} />
                <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
        );
    };

    const renderStatusModal = () => {
        if (!editingEvent) return null;

        const isClosed = editingEvent.status === TaskStatus.CLOSED;
        const isPending = !isClosed && editingEvent.eventApprovalStatus === EventApprovalStatus.PENDING;
        const isApproved = !isClosed && editingEvent.eventApprovalStatus === EventApprovalStatus.APPROVED;

        return (
            <BottomSheet visible={!!editingEvent} onClose={() => setEditingEvent(null)} title={editingEvent.taskName}>
                <BottomSheetOption label="Pending" onPress={() => handleStatusChange("pending")} selected={isPending} />
                <BottomSheetOption label="Approved" onPress={() => handleStatusChange("approved")} selected={isApproved} />
                <BottomSheetOption label="Closed" onPress={() => handleStatusChange("closed")} selected={isClosed} />
            </BottomSheet>
        );
    };

    const renderDayViewEvent = (event: CalendarEvent) => {
        const { border } = getEventColors(event);
        const isClosed = event.status === TaskStatus.CLOSED;
        const isPending = !isClosed && event.eventApprovalStatus === EventApprovalStatus.PENDING;
        const currentStatusLabel = isClosed ? "Closed" : isPending ? "Pending" : "Approved";

        return (
            <Pressable
                key={event.taskId}
                style={[styles.dayViewEvent, { borderLeftColor: border }]}
                onPress={() => handleEventPress(event)}
                onLongPress={() => setEditingEvent(event)}
            >
                <Text style={styles.dayViewEventTime}>{formatDayViewTime(event)}</Text>
                <Text style={[styles.dayViewEventName, event.isRejected && styles.eventRejected]} numberOfLines={2}>
                    {event.taskName}
                </Text>
                <Text
                    style={[
                        styles.statusLabel,
                        isClosed
                            ? styles.statusLabelClosed
                            : isPending
                              ? styles.statusLabelPending
                              : styles.statusLabelApproved,
                    ]}
                >
                    {currentStatusLabel}
                </Text>
            </Pressable>
        );
    };

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

                <ScrollView
                    style={styles.dayViewContent}
                    contentContainerStyle={styles.dayViewContentContainer}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
                    }
                    {...dayPanResponder.panHandlers}
                >
                    {dayEvents.length === 0 ? (
                        <View style={styles.noEventsContainer}>
                            <Text style={styles.noEventsText}>No events this day</Text>
                        </View>
                    ) : (
                        dayEvents.map(renderDayViewEvent)
                    )}
                </ScrollView>
                {renderStatusModal()}
                {renderToast()}
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
                    <View style={styles.headerTopRight}>
                        <Text style={styles.eventCount}>{events.length} events</Text>
                        <Pressable
                            style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshButtonPressed]}
                            onPress={() => refetch()}
                        >
                            <Text style={styles.refreshButtonText}>{isRefetching ? "..." : "↻"}</Text>
                        </Pressable>
                    </View>
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
                            <Text style={[styles.viewButtonText, viewMode === "week" && styles.viewButtonTextActive]}>
                                Week
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.viewButton, viewMode === "month" && styles.viewButtonActive]}
                            onPress={() => setViewMode("month")}
                        >
                            <Text style={[styles.viewButtonText, viewMode === "month" && styles.viewButtonTextActive]}>
                                Month
                            </Text>
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
            <View style={styles.calendarGrid} {...monthPanResponder.panHandlers}>
                {rows.map((row, rowIndex) => {
                    const spanningEvents = getSpanningEventsForRow(events, row);
                    return (
                        <View key={rowIndex} style={styles.weekRow}>
                            {/* Spanning events layer - pointerEvents none to allow taps through to day cells */}
                            <View style={styles.spanningEventsLayer} pointerEvents="none">
                                {spanningEvents.map((se, idx) => renderSpanningEvent(se, idx))}
                            </View>
                            {/* Day cells */}
                            {row.map((day, dayIndex) => (
                                <View key={dayIndex} style={styles.dayCellWrapper}>
                                    {renderDay(day, spanningEvents.length)}
                                </View>
                            ))}
                        </View>
                    );
                })}
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
    headerTopRight: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: "600" as const,
        color: colors.text,
    },
    eventCount: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginRight: spacing.xs,
    },
    refreshButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    refreshButtonPressed: {
        opacity: 0.5,
    },
    refreshButtonText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
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
        position: "relative" as const,
    },
    spanningEventsLayer: {
        position: "absolute" as const,
        top: 20,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    spanningEvent: {
        position: "absolute" as const,
        height: 18,
        paddingHorizontal: 1,
        paddingVertical: 1,
    },
    spanningEventStart: {
        paddingLeft: 4,
    },
    spanningEventEnd: {
        paddingRight: 4,
    },
    spanningEventInner: {
        flex: 1,
        borderRadius: 3,
        borderLeftWidth: 2,
        paddingHorizontal: 4,
        justifyContent: "center" as const,
    },
    spanningEventName: {
        fontSize: 9,
        color: colors.text,
        fontWeight: "500" as const,
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
        paddingVertical: 2,
        borderRadius: 2,
        marginBottom: 1,
        borderLeftWidth: 2,
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
    statusButtons: {
        flexDirection: "row" as const,
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    statusButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surfaceElevated,
    },
    statusButtonPending: {
        backgroundColor: colors.warning,
    },
    statusButtonApproved: {
        backgroundColor: colors.primary,
    },
    statusButtonClosed: {
        backgroundColor: colors.textMuted,
    },
    statusButtonText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    statusButtonTextActive: {
        color: "#fff",
        fontWeight: "500" as const,
    },
    statusLabel: {
        fontSize: fontSize.xs,
        marginTop: spacing.xs,
    },
    statusLabelPending: {
        color: colors.warning,
    },
    statusLabelApproved: {
        color: colors.primary,
    },
    statusLabelClosed: {
        color: colors.textMuted,
    },
    // Toast styles
    toast: {
        position: "absolute" as const,
        top: 60,
        alignSelf: "center" as const,
        flexDirection: "row" as const,
        alignItems: "center" as const,
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toastDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
        marginRight: spacing.sm,
    },
    toastText: {
        color: colors.text,
        fontSize: fontSize.sm,
    },
});

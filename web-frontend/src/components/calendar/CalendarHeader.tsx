import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../ui/button";
import type { ViewMode } from "../../utils/calendar";

interface CalendarHeaderProps {
    currentDate: Date;
    viewMode: ViewMode;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
    onViewModeChange: (mode: ViewMode) => void;
    onCreateEvent: () => void;
    eventCount?: number;
}

export function CalendarHeader({
    currentDate,
    viewMode,
    onPrevious,
    onNext,
    onToday,
    onViewModeChange,
    onCreateEvent,
    eventCount,
}: CalendarHeaderProps) {
    const monthYear = currentDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });

    const weekRange = (() => {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(
            undefined,
            { month: "short", day: "numeric", year: "numeric" }
        )}`;
    })();

    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={onPrevious}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onToday}>
                        Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={onNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{viewMode === "month" ? monthYear : weekRange}</h2>
                    {eventCount !== undefined && (
                        <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                            {eventCount} event{eventCount !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    variant={viewMode === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("week")}
                >
                    Week
                </Button>
                <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange("month")}
                >
                    Month
                </Button>
                <Button onClick={onCreateEvent} size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    New Event
                </Button>
            </div>
        </div>
    );
}

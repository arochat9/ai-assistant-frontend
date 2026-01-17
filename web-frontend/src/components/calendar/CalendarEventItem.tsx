import { useState, useRef } from "react";
import { EventApprovalStatus } from "shared";
import type { CalendarEvent } from "../../utils/calendar";
import { formatEventTime } from "../../utils/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { CalendarEventPopover } from "./CalendarEventPopover";
import { Check } from "lucide-react";

interface CalendarEventItemProps {
    event: CalendarEvent;
    onClick: (event: CalendarEvent) => void;
    onUpdateTime?: (eventId: string, startTime: Date, endTime: Date, approvalStatus?: EventApprovalStatus) => void;
    onComplete?: (event: CalendarEvent) => void;
}

export function CalendarEventItem({ event, onClick, onUpdateTime, onComplete }: CalendarEventItemProps) {
    const [open, setOpen] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);

    const getEventStyles = () => {
        if (event.isRejected) {
            return "bg-destructive/10 border-destructive/20 text-destructive line-through";
        }

        if (event.eventApprovalStatus === EventApprovalStatus.PENDING) {
            return "bg-yellow-50 border-yellow-200 text-yellow-900 border-dashed";
        }

        return "bg-primary/10 border-primary/20 text-primary";
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;
        // Only allow swipe right (positive offset), max 80px
        if (diff > 0) {
            setSwipeOffset(Math.min(diff, 80));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (swipeOffset > 40) {
            // Keep it open if swiped more than halfway
            setSwipeOffset(80);
        } else {
            // Snap back if not swiped enough
            setSwipeOffset(0);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        startX.current = e.clientX;
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        currentX.current = e.clientX;
        const diff = currentX.current - startX.current;
        if (diff > 0) {
            setSwipeOffset(Math.min(diff, 80));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (swipeOffset > 40) {
            setSwipeOffset(80);
        } else {
            setSwipeOffset(0);
        }
    };

    const handleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onComplete) {
            onComplete(event);
        }
        setSwipeOffset(0);
    };

    return (
        <div className="relative overflow-hidden">
            {/* Complete button background */}
            <div
                className="absolute inset-y-0 left-0 flex items-center justify-center bg-green-500 text-white transition-all"
                style={{ width: `${swipeOffset}px` }}
            >
                {swipeOffset > 40 && (
                    <button onClick={handleComplete} className="px-3 h-full">
                        <Check className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Swipeable event item */}
            <div
                className="relative transition-transform"
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    if (isDragging) handleMouseUp();
                }}
            >
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getEventStyles()}`}
                        >
                            <div className="font-medium truncate">{event.taskName || "Untitled Event"}</div>
                            <div className="text-[10px] opacity-75">{formatEventTime(event)}</div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96" side="right" align="start">
                        <CalendarEventPopover
                            event={event}
                            onUpdateTime={onUpdateTime}
                            onOpenDrawer={() => {
                                setOpen(false);
                                onClick(event);
                            }}
                            onClose={() => setOpen(false)}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

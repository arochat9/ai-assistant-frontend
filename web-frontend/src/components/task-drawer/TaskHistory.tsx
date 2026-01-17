import { History } from "lucide-react";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";
import { tasksApi } from "../../services/api";
import type { TaskChangelog } from "shared";

interface TaskHistoryProps {
    taskId: string;
}

export function TaskHistory({ taskId }: TaskHistoryProps) {
    const [changelogs, setChangelogs] = useState<TaskChangelog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) return;

        let cancelled = false;

        const fetchHistory = async () => {
            try {
                const response = await tasksApi.getTaskChangelogs({ taskId });
                if (!cancelled) {
                    setChangelogs(response.changelogs);
                    setLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch task history:", error);
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            cancelled = true;
        };
    }, [taskId]);

    // Group changes by snapshotId
    const groupedChanges = changelogs.reduce((groups, change) => {
        const key = change.snapshotId;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(change);
        return groups;
    }, {} as Record<string, TaskChangelog[]>);

    // Convert to array and sort by timestamp (newest first)
    const sortedGroups = Object.values(groupedChanges).sort((a, b) => {
        const timeA = a[0].timestamp instanceof Date ? a[0].timestamp : new Date(a[0].timestamp);
        const timeB = b[0].timestamp instanceof Date ? b[0].timestamp : new Date(b[0].timestamp);
        return timeB.getTime() - timeA.getTime();
    });

    const totalChanges = changelogs.length;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Change History
                </h4>
                {!loading && totalChanges > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {totalChanges} {totalChanges === 1 ? "change" : "changes"}
                    </Badge>
                )}
            </div>
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading history...</p>
            ) : totalChanges === 0 ? (
                <p className="text-sm text-muted-foreground">No changes recorded</p>
            ) : (
                <div className="space-y-3">
                    {sortedGroups.map((group) => {
                        const firstChange = group[0];
                        return (
                            <div key={firstChange.snapshotId} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="text-xs text-muted-foreground">
                                        {(firstChange.timestamp instanceof Date
                                            ? firstChange.timestamp
                                            : new Date(firstChange.timestamp)
                                        ).toLocaleString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {firstChange.updatedBy || "Unknown"}
                                    </Badge>
                                </div>
                                <div className="space-y-2 pl-1">
                                    {group.map((change) => (
                                        <div key={change.changelogId} className="space-y-1">
                                            <span className="font-semibold text-sm">{change.fieldName}</span>
                                            <div className="space-y-1 pl-2">
                                                {change.oldValue && (
                                                    <div className="text-xs">
                                                        <span className="text-muted-foreground">From: </span>
                                                        <span className="line-through text-muted-foreground">
                                                            {change.oldValue}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-xs">
                                                    <span className="text-muted-foreground">To: </span>
                                                    <span className="font-medium">
                                                        {change.newValue || <span className="italic">—</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { tasksApi } from "../services/api";
import { useTaskDrawer } from "../contexts/TaskDrawerContext";
import { Badge } from "../components/ui/badge";
import type { TaskChangelog } from "shared";

export function TasksChangelogPage() {
    const { openDrawer } = useTaskDrawer();

    const { data, isLoading } = useQuery({
        queryKey: ["changelogs"],
        queryFn: () => tasksApi.getTaskChangelogs({}),
    });

    const changelogs = data?.changelogs ?? [];

    // Group changes by snapshotId
    const groupedChanges = changelogs.reduce(
        (groups, change) => {
            const key = change.snapshotId;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(change);
            return groups;
        },
        {} as Record<string, TaskChangelog[]>,
    );

    // Convert to array and sort by timestamp (newest first)
    const sortedGroups = Object.values(groupedChanges).sort((a, b) => {
        const timeA = a[0].timestamp instanceof Date ? a[0].timestamp : new Date(a[0].timestamp);
        const timeB = b[0].timestamp instanceof Date ? b[0].timestamp : new Date(b[0].timestamp);
        return timeB.getTime() - timeA.getTime();
    });

    const handleRowClick = async (taskId: string) => {
        try {
            const response = await tasksApi.getTaskById(taskId);
            openDrawer(response.task);
        } catch (error) {
            console.error("Failed to fetch task:", error);
        }
    };

    const totalChanges = changelogs.length;

    return (
        <div className="h-full p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Tasks Changelog</h2>
                    <p className="text-muted-foreground">View all task changes and updates</p>
                </div>
                {!isLoading && totalChanges > 0 && (
                    <Badge variant="secondary" className="text-sm">
                        {totalChanges} {totalChanges === 1 ? "change" : "changes"}
                    </Badge>
                )}
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <p className="text-muted-foreground">Loading changelog...</p>
                </div>
            ) : totalChanges === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No changes recorded yet</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto border rounded-lg">
                    <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th
                                    className="text-left px-3 py-2 font-medium text-sm"
                                    style={{
                                        boxShadow: "inset 0 -1px 0 0 hsl(var(--border))",
                                        maxWidth: "24rem",
                                        minWidth: "12rem",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    Task Title
                                </th>
                                <th
                                    className="text-left px-3 py-2 font-medium text-sm whitespace-nowrap"
                                    style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                                >
                                    Timestamp
                                </th>
                                <th
                                    className="text-left px-3 py-2 font-medium text-sm whitespace-nowrap"
                                    style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                                >
                                    Updated By
                                </th>
                                <th
                                    className="text-left px-3 py-2 font-medium text-sm"
                                    style={{ boxShadow: "inset 0 -1px 0 0 hsl(var(--border))" }}
                                >
                                    Changes
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedGroups.map((group) => {
                                const firstChange = group[0];
                                return (
                                    <tr
                                        key={firstChange.snapshotId}
                                        onClick={() => handleRowClick(firstChange.taskId)}
                                        className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <td
                                            className="p-3 text-sm font-semibold"
                                            style={{ maxWidth: "24rem", minWidth: "12rem", wordBreak: "break-word" }}
                                        >
                                            {firstChange.taskName || (
                                                <span className="italic text-muted-foreground">Untitled</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
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
                                        </td>
                                        <td className="p-3 text-sm">
                                            <Badge variant="outline" className="text-xs">
                                                {firstChange.updatedBy || "Unknown"}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            <div className="space-y-2">
                                                {group.map((change) => (
                                                    <div key={change.changelogId} className="text-sm">
                                                        <span className="font-semibold">{change.fieldName}: </span>
                                                        {change.oldValue && (
                                                            <span className="text-muted-foreground line-through mr-2">
                                                                {change.oldValue}
                                                            </span>
                                                        )}
                                                        <span className="text-muted-foreground mr-1">→</span>
                                                        <span className="font-medium">
                                                            {change.newValue || (
                                                                <span className="italic text-muted-foreground">—</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

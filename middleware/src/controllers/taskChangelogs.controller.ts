import { Request, Response } from "express";
import { Task, TaskChangelog } from "@ai-assistant-third-party-app/sdk";
import { Osdk } from "@osdk/client";
import { client } from "../config/foundry";
import { TaskChangelogFilters, TaskChangelogsResponse } from "shared";
import type { TaskChangelog as TaskChangelogType } from "shared";

/**
 * POST endpoint that fetches task changelogs with optional filtering
 * Body: TaskChangelogFilters
 */
export async function getTaskChanges(req: Request, res: Response) {
    try {
        const filters: TaskChangelogFilters = req.body;

        // Build query conditions
        const whereConditions: Array<Record<string, unknown>> = [];
        if (filters.taskId) {
            whereConditions.push({ taskId: { $eq: filters.taskId } });
        } else {
            const taskIds = await client(Task).fetchPage({
                $pageSize: 100,
                $orderBy: { updatedAt: "desc" },
            });
            whereConditions.push({ taskId: { $in: taskIds.data.map((t) => t.taskId) } });
        }

        if (filters.changelogIds && filters.changelogIds.length > 0) {
            whereConditions.push({ taskChangelogId: { $in: filters.changelogIds } });
        }

        const query =
            whereConditions.length > 0 ? client(TaskChangelog).where({ $and: whereConditions }) : client(TaskChangelog);

        const changelogs: Osdk.Instance<TaskChangelog>[] = [];
        for await (const item of query.asyncIter()) {
            changelogs.push(item);
        }

        // Group snapshots by taskId
        const snapshotsByTask = (changelogs ?? []).reduce(
            (acc, snapshot) => {
                const taskId = snapshot.taskId ?? "";
                if (!acc[taskId]) {
                    acc[taskId] = [];
                }
                acc[taskId].push(snapshot);
                return acc;
            },
            {} as Record<string, Osdk.Instance<TaskChangelog>[]>,
        );

        const changes: TaskChangelogType[] = [];

        // Compute field-level changes for each task
        for (const [taskId, snapshots] of Object.entries(snapshotsByTask)) {
            // Sort by timestamp
            snapshots.sort((a, b) => {
                const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return timeA - timeB;
            });

            // Handle first snapshot (task creation)
            if (snapshots.length > 0) {
                const first = snapshots[0];
                const timestamp = first.createdAt ? new Date(first.createdAt) : new Date();
                const baseId = first.taskChangelogId ?? "";

                changes.push({
                    changelogId: `${baseId}-created`,
                    snapshotId: baseId,
                    taskId,
                    taskName: first.taskName ?? "Unknown Task",
                    fieldName: "Task Created",
                    oldValue: undefined,
                    newValue: first.taskName ?? undefined,
                    timestamp,
                    updatedBy: first.updatedBy,
                });
            }

            // Compare consecutive snapshots within the same task
            for (let i = 1; i < snapshots.length; i++) {
                const current = snapshots[i];
                const previous = snapshots[i - 1];

                const timestamp = current.updatedAt ? new Date(current.updatedAt) : new Date();
                const updatedBy = current.updatedBy;
                const taskId = current.taskId ?? "";
                const baseId = current.taskChangelogId ?? "";

                // String fields
                const stringFields: Array<{ key: keyof Osdk.Instance<TaskChangelog>; name: string }> = [
                    { key: "taskName", name: "Task Name" },
                    { key: "taskContext", name: "Task Context" },
                    { key: "taskOrEvent", name: "Task/Event" },
                    { key: "subType", name: "Sub Type" },
                    { key: "status", name: "Status" },
                    { key: "eventApprovalStatus", name: "Event Approval Status" },
                    { key: "plannedFor", name: "Planned For" },
                    { key: "source", name: "Source" },
                    { key: "userNotes", name: "User Notes" },
                ];

                stringFields.forEach(({ key, name }) => {
                    const currentVal = current[key];
                    const previousVal = previous[key];

                    if (currentVal !== previousVal) {
                        changes.push({
                            changelogId: `${baseId}-${name.replace(/\s+/g, "_")}`,
                            snapshotId: baseId,
                            taskId,
                            taskName: current.taskName ?? "Unknown Task",
                            fieldName: name,
                            oldValue: previousVal ? String(previousVal) : undefined,
                            newValue: currentVal ? String(currentVal) : undefined,
                            timestamp,
                            updatedBy,
                        });
                    }
                });

                // Array fields - compare sorted arrays
                const arrayFields: Array<{ key: keyof Osdk.Instance<TaskChangelog>; name: string }> = [
                    { key: "sourceMessageIds", name: "Source Message IDs" },
                    { key: "tags", name: "Tags" },
                ];

                arrayFields.forEach(({ key, name }) => {
                    const currentVal = current[key];
                    const previousVal = previous[key];

                    const currentArr = Array.isArray(currentVal) ? currentVal.slice().sort() : [];
                    const previousArr = Array.isArray(previousVal) ? previousVal.slice().sort() : [];

                    if (JSON.stringify(currentArr) !== JSON.stringify(previousArr)) {
                        changes.push({
                            changelogId: `${baseId}-${name.replace(/\s+/g, "_")}`,
                            snapshotId: baseId,
                            taskId,
                            taskName: current.taskName ?? "Unknown Task",
                            fieldName: name,
                            oldValue: previousArr.length > 0 ? previousArr.join(", ") : undefined,
                            newValue: currentArr.length > 0 ? currentArr.join(", ") : undefined,
                            timestamp,
                            updatedBy,
                        });
                    }
                });

                // Date fields (exclude updatedAt - it changes on every snapshot)
                const dateFields: Array<{ key: keyof Osdk.Instance<TaskChangelog>; name: string }> = [
                    { key: "taskDueTime", name: "Due Time" },
                    { key: "eventStartTime", name: "Event Start" },
                    { key: "eventEndTime", name: "Event End" },
                    { key: "completedAt", name: "Completed At" },
                    { key: "createdAt", name: "Created At" },
                ];

                dateFields.forEach(({ key, name }) => {
                    const currentVal = current[key];
                    const previousVal = previous[key];

                    // Type guard: only process if values are valid date types
                    const currentStr =
                        currentVal && (typeof currentVal === "string" || currentVal instanceof Date)
                            ? new Date(currentVal).toISOString()
                            : "";
                    const previousStr =
                        previousVal && (typeof previousVal === "string" || previousVal instanceof Date)
                            ? new Date(previousVal).toISOString()
                            : "";

                    if (currentStr !== previousStr) {
                        changes.push({
                            changelogId: `${baseId}-${name.replace(/\s+/g, "_")}`,
                            snapshotId: baseId,
                            taskId,
                            taskName: current.taskName ?? "Unknown Task",
                            fieldName: name,
                            oldValue: previousStr || undefined,
                            newValue: currentStr || undefined,
                            timestamp,
                            updatedBy,
                        });
                    }
                });
            }
        }

        const response: TaskChangelogsResponse = {
            changelogs: changes.reverse(), // Newest first
            nextPageToken: undefined,
        };

        return res.json(response);
    } catch (error) {
        console.error("Error fetching task changelogs:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch task changelogs";
        return res.status(500).json({
            error: "Failed to fetch task changelogs",
            details: errorMessage,
        });
    }
}

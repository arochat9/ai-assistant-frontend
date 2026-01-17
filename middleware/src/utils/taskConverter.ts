import { Task as OsdkTask } from "@ai-assistant-third-party-app/sdk";
import { Osdk } from "@osdk/client";
import { Task, TaskStatus, SubType, TaskOrEvent, EventApprovalStatus, PlannedFor, Source } from "shared";

/**
 * Converts an OSDK Task instance to our custom Task interface
 * Excludes runId and environment fields
 */
export function convertOsdkTaskToTask(osdkTask: Osdk.Instance<OsdkTask>, chats: string[] | undefined): Task {
    return {
        taskId: osdkTask.taskId,
        taskName: osdkTask.taskName ?? "",
        taskContext: osdkTask.taskContext,
        taskDueTime: osdkTask.taskDueTime ? new Date(osdkTask.taskDueTime) : undefined,
        taskOrEvent: osdkTask.taskOrEvent as TaskOrEvent,
        subType: osdkTask.subType as SubType,
        status: osdkTask.status as TaskStatus,
        eventStartTime: osdkTask.eventStartTime ? new Date(osdkTask.eventStartTime) : undefined,
        eventEndTime: osdkTask.eventEndTime ? new Date(osdkTask.eventEndTime) : undefined,
        eventApprovalStatus: osdkTask.eventApprovalStatus as EventApprovalStatus | undefined,
        sourceMessageIds: osdkTask.sourceMessageIds,
        createdAt: osdkTask.createdAt ? new Date(osdkTask.createdAt) : new Date(),
        updatedAt: osdkTask.updatedAt ? new Date(osdkTask.updatedAt) : new Date(),
        completedAt: osdkTask.completedAt ? new Date(osdkTask.completedAt) : undefined,
        unversionedTaskId: osdkTask.unversionedTaskId,
        plannedFor: osdkTask.plannedFor as PlannedFor | undefined,
        source: osdkTask.source as Source | undefined,
        tags: osdkTask.tags,
        userNotes: osdkTask.userNotes,
        chats: chats,
        isRecurring: osdkTask.isRecurring,
    };
}

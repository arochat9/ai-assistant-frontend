import { z } from "zod";
import { TaskStatus, SubType, TaskOrEvent, EventApprovalStatus, PlannedFor, Source } from "./enums.js";

// Custom Task interface (excludes runId and environment from OSDK Task)
export interface Task {
    taskId: string;
    taskName: string;
    taskContext?: string;
    taskDueTime?: Date;
    taskOrEvent: TaskOrEvent;
    subType: SubType;
    status: TaskStatus;
    eventStartTime?: Date;
    eventEndTime?: Date;
    eventApprovalStatus?: EventApprovalStatus;
    sourceMessageIds?: string[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    unversionedTaskId?: string;
    plannedFor?: PlannedFor;
    source?: Source;
    tags?: string[];
    userNotes?: string;
    chats?: string[];
    isRecurring?: boolean;
}

// Task Filters Schema
export const TaskFiltersSchema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    subType: z.nativeEnum(SubType).optional(),
    taskOrEvent: z.nativeEnum(TaskOrEvent).optional(),
    keyword: z.string().optional(),
    updatedAfter: z.date().optional(),
    eventStartAfter: z.date().optional(),
    eventStartBefore: z.date().optional(),
    eventEndAfter: z.date().optional(),
    eventEndBefore: z.date().optional(),
    isRecurring: z.boolean().optional(),
});

export type TaskFilters = z.infer<typeof TaskFiltersSchema>;

// Create Task Schema
export const CreateTaskSchema = z.object({
    eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional(),
    eventEndTime: z.date().optional(),
    eventStartTime: z.date().optional(),
    plannedFor: z.nativeEnum(PlannedFor).optional(),
    source: z.nativeEnum(Source).optional(),
    status: z.nativeEnum(TaskStatus),
    subType: z.nativeEnum(SubType),
    tags: z.array(z.string()).optional(),
    taskDueTime: z.date().optional(),
    taskName: z.string().optional(),
    taskOrEvent: z.nativeEnum(TaskOrEvent),
    userNotes: z.string().optional(),
    isRecurring: z.boolean(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// Update Task Schema - timestamps are Date objects
export const UpdateTaskSchema = z.object({
    taskId: z.string(),
    eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional(),
    eventEndTime: z.date().optional(),
    eventStartTime: z.date().optional(),
    plannedFor: z.nativeEnum(PlannedFor).optional(),
    source: z.nativeEnum(Source).optional(),
    status: z.nativeEnum(TaskStatus),
    subType: z.nativeEnum(SubType),
    tags: z.array(z.string()).optional(),
    taskDueTime: z.date().optional(),
    taskName: z.string().optional(),
    taskOrEvent: z.nativeEnum(TaskOrEvent),
    userNotes: z.string().optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// Response Schemas
export const TasksResponseSchema = z.object({
    tasks: z.array(z.custom<Task>()),
    nextPageToken: z.string().optional(),
});

export type TasksResponse = z.infer<typeof TasksResponseSchema>;

export const TaskResponseSchema = z.object({
    task: z.custom<Task>(),
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;

export const TaskActionResponseSchema = z.object({
    success: z.boolean(),
    task: z.custom<Task>().optional(),
});

export type TaskActionResponse = z.infer<typeof TaskActionResponseSchema>;

export const ErrorResponseSchema = z.object({
    error: z.string(),
    details: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// TaskChangelog Interface - field-level change record
export interface TaskChangelog {
    changelogId: string;
    snapshotId: string; // ID of the TaskChangelog snapshot (groups related field changes)
    taskId: string;
    taskName: string; // Name of the task for display
    fieldName: string; // The field that changed
    oldValue?: string; // Previous value
    newValue?: string; // New value
    timestamp: Date; // When the change happened
    updatedBy?: string; // Who made the change
}

// TaskChangelog Filters Schema
export const TaskChangelogFiltersSchema = z.object({
    taskId: z.string().optional(),
    changelogIds: z.array(z.string()).optional(),
});

export type TaskChangelogFilters = z.infer<typeof TaskChangelogFiltersSchema>;

// TaskChangelog Response Schema
export const TaskChangelogsResponseSchema = z.object({
    changelogs: z.array(z.custom<TaskChangelog>()),
    nextPageToken: z.string().optional(),
});

export type TaskChangelogsResponse = z.infer<typeof TaskChangelogsResponseSchema>;

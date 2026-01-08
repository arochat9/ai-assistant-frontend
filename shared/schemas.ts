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
}

// Task Filters Schema
export const TaskFiltersSchema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    subType: z.nativeEnum(SubType).optional(),
    keyword: z.string().optional(),
    updatedAfter: z.date().optional(),
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

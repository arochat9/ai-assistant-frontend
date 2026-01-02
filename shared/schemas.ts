import { z } from "zod";
import { TaskStatus, SubType, TaskOrEvent, EventApprovalStatus, Environment, RunId } from "./enums";

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
    environment: z.nativeEnum(Environment),
    event_end_time: z.date().optional(),
    event_start_time: z.date().optional(),
    eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional(),
    runID: z.nativeEnum(RunId),
    sourceMessageIds: z.array(z.string()),
    status: z.nativeEnum(TaskStatus),
    task_context: z.string().optional(),
    task_due_time: z.date().optional(),
    task_name: z.string(),
    task_or_event: z.nativeEnum(TaskOrEvent),
    task_type: z.nativeEnum(SubType),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// Update Task Schema - timestamps are Date objects
export const UpdateTaskSchema = z.object({
    taskId: z.string(),
    runId: z.nativeEnum(RunId),
    task_name: z.string().optional(),
    task_type: z.nativeEnum(SubType).optional(),
    task_or_event: z.nativeEnum(TaskOrEvent).optional(),
    task_due_time: z.date().optional(),
    event_start_time: z.date().optional(),
    event_end_time: z.date().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    task_context: z.string().optional(),
    additionalMessageIds: z.array(z.string()).optional(),
    eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional(),
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

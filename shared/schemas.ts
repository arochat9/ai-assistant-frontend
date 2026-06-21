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
    chatId: z.string().optional(),
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

// Message Interface
export interface Message {
    messageId: string;
    content: string;
    senderName: string;
    repliedToId: string | undefined;
}

// Extended message with timestamp/chat context
export interface MessageWithContext extends Message {
    chatId: string;
    timeReceived?: Date;
    isFromMe: boolean;
}

// Message Filters Schema
export const MessageFiltersSchema = z.object({
    messageIds: z.array(z.string()),
});

export type MessageFilters = z.infer<typeof MessageFiltersSchema>;

// Chat Messages Filters Schema (for paginated chat messages)
export const ChatMessagesFiltersSchema = z.object({
    pageSize: z.number().optional(),
    pageToken: z.string().optional(),
});

export type ChatMessagesFilters = z.infer<typeof ChatMessagesFiltersSchema>;

// Message Response Schema
export const MessagesResponseSchema = z.object({
    messages: z.array(z.custom<Message>()),
});

export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;

// Chat Messages Response Schema (paginated)
export const ChatMessagesResponseSchema = z.object({
    messages: z.array(z.custom<MessageWithContext>()),
    nextPageToken: z.string().optional(),
});

export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;

// Chat Interface
export interface ChatMember {
    userId: string;
    name: string;
}

export interface Chat {
    chatId: string;
    displayName: string;
    chatType?: string;
    members: ChatMember[];
    lastMessageTime?: Date;
    lastMessagePreview?: string;
    openTaskCount: number;
}

// Chat Filters Schema
export const ChatFiltersSchema = z.object({
    keyword: z.string().optional(),
});

export type ChatFilters = z.infer<typeof ChatFiltersSchema>;

// Chat Response Schemas
export const ChatsResponseSchema = z.object({
    chats: z.array(z.custom<Chat>()),
});

export type ChatsResponse = z.infer<typeof ChatsResponseSchema>;

export const ChatDetailResponseSchema = z.object({
    chat: z.custom<Chat>(),
    description: z.string(),
});

export type ChatDetailResponse = z.infer<typeof ChatDetailResponseSchema>;

// Messages Metrics
export interface TopChat {
    chatId: string;
    displayName: string;
    messageCount: number;
}

export interface MessagesMetrics {
    sentThisWeek: number;
    sentThisMonth: number;
    sentThisYear: number;
    mostActiveWeek: TopChat | null;
    mostActiveMonth: TopChat | null;
    mostActiveYear: TopChat | null;
}

export const MessagesMetricsResponseSchema = z.object({
    metrics: z.custom<MessagesMetrics>(),
});

export type MessagesMetricsResponse = z.infer<typeof MessagesMetricsResponseSchema>;

// Message Search
export const MessageSearchFiltersSchema = z.object({
    phraseGroups: z.array(z.array(z.string())),
    chatIds: z.array(z.string()).optional(),
    surroundingMessagesCount: z.number().optional(),
});

export type MessageSearchFilters = z.infer<typeof MessageSearchFiltersSchema>;

export const MessageSearchResponseSchema = z.object({
    result: z.string(),
});

export type MessageSearchResponse = z.infer<typeof MessageSearchResponseSchema>;

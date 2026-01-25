// Enums
export enum TaskStatus {
    OPEN = "Open",
    CLOSED = "Closed",
    BACKLOGGED = "Backlogged",
}

export enum SubType {
    FUN = "Fun",
    TEXT_RESPONSE = "Text response",
    CHORE = "Chore",
    ERRAND = "Errand",
}

export enum TaskOrEvent {
    TASK = "Task",
    EVENT = "Event",
}

export enum EventApprovalStatus {
    PENDING = "Pending",
    APPROVED = "Approved",
}

export enum PlannedFor {
    TODAY = "Today",
    TODAY_STRETCH_GOAL = "Today - Stretch Goal",
    TOMORROW = "Tomorrow",
    TOMORROW_STRETCH_GOAL = "Tomorrow - Stretch Goal",
    THIS_WEEK = "This Week",
    THIS_WEEK_STRETCH_GOAL = "This Week (Stretch Goal)",
}

export enum Source {
    AGENT = "Agent",
    USER = "User",
    GOOGLE_CALENDAR = "Google Calendar",
}

// Task interface
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

// Filter types
export interface TaskFilters {
    status?: TaskStatus;
    subType?: SubType;
    taskOrEvent?: TaskOrEvent;
    keyword?: string;
    updatedAfter?: Date;
    eventStartAfter?: Date;
    eventStartBefore?: Date;
    eventEndAfter?: Date;
    eventEndBefore?: Date;
    isRecurring?: boolean;
}

// API Input types
export interface CreateTaskInput {
    eventApprovalStatus?: EventApprovalStatus;
    eventEndTime?: Date;
    eventStartTime?: Date;
    plannedFor?: PlannedFor;
    source?: Source;
    status: TaskStatus;
    subType: SubType;
    tags?: string[];
    taskDueTime?: Date;
    taskName?: string;
    taskOrEvent: TaskOrEvent;
    userNotes?: string;
    isRecurring: boolean;
}

export interface UpdateTaskInput {
    taskId: string;
    eventApprovalStatus?: EventApprovalStatus;
    eventEndTime?: Date;
    eventStartTime?: Date;
    plannedFor?: PlannedFor;
    source?: Source;
    status: TaskStatus;
    subType: SubType;
    tags?: string[];
    taskDueTime?: Date;
    taskName?: string;
    taskOrEvent: TaskOrEvent;
    userNotes?: string;
}

// API Response types
export interface TasksResponse {
    tasks: Task[];
    nextPageToken?: string;
}

export interface TaskResponse {
    task: Task;
}

export interface TaskActionResponse {
    success: boolean;
    task?: Task;
}

// TaskChangelog Interface
export interface TaskChangelog {
    changelogId: string;
    snapshotId: string;
    taskId: string;
    taskName: string;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    timestamp: Date;
    updatedBy?: string;
}

export interface TaskChangelogFilters {
    taskId?: string;
    changelogIds?: string[];
}

export interface TaskChangelogsResponse {
    changelogs: TaskChangelog[];
    nextPageToken?: string;
}

// Helper functions
export const getTaskStatusValues = () => Object.values(TaskStatus);
export const getSubTypeValues = () => Object.values(SubType);
export const getPlannedForValues = () => Object.values(PlannedFor);

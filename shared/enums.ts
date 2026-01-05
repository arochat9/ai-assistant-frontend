/**
 * Task enumeration types
 * Shared enums for task properties across the application
 */

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

export enum Environment {
    PRODUCTION = "prod",
}

export enum RunId {
    BASELINE = "baseline",
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
}

// Helper functions to get enum values as arrays
export const getTaskStatusValues = () => Object.values(TaskStatus);
export const getSubTypeValues = () => Object.values(SubType);
export const getTaskOrEventValues = () => Object.values(TaskOrEvent);
export const getEventApprovalStatusValues = () => Object.values(EventApprovalStatus);
export const getEnvironmentValues = () => Object.values(Environment);
export const getRunIdValues = () => Object.values(RunId);
export const getPlannedForValues = () => Object.values(PlannedFor);
export const getSourceValues = () => Object.values(Source);

// Helper functions to check if a value is valid
export const isValidTaskStatus = (value: string): value is TaskStatus =>
    Object.values(TaskStatus).includes(value as TaskStatus);

export const isValidSubType = (value: string): value is SubType => Object.values(SubType).includes(value as SubType);

export const isValidTaskOrEvent = (value: string): value is TaskOrEvent =>
    Object.values(TaskOrEvent).includes(value as TaskOrEvent);

export const isValidEventApprovalStatus = (value: string): value is EventApprovalStatus =>
    Object.values(EventApprovalStatus).includes(value as EventApprovalStatus);

export const isValidEnvironment = (value: string): value is Environment =>
    Object.values(Environment).includes(value as Environment);

export const isValidRunId = (value: string): value is RunId => Object.values(RunId).includes(value as RunId);

export const isValidPlannedFor = (value: string): value is PlannedFor =>
    Object.values(PlannedFor).includes(value as PlannedFor);

export const isValidSource = (value: string): value is Source => Object.values(Source).includes(value as Source);

import { tool } from "ai";
import { z } from "zod";
import { TaskStatus, SubType, TaskOrEvent, PlannedFor, Source, EventApprovalStatus } from "shared";
import { fetchTasks, fetchTaskById } from "./taskQueries";
import { createTask, updateTask } from "./taskMutations";

export const agentTools = {
    getTasks: tool({
        description: "Get tasks with optional filters. Use when user asks about tasks, to-dos, or their schedule.",
        parameters: z.object({
            status: z
                .nativeEnum(TaskStatus)
                .optional()
                .describe("Filter by status. Default to Open since there are many closed tasks."),
            subType: z.nativeEnum(SubType).optional().describe("Filter by task subtype"),
            taskOrEvent: z.nativeEnum(TaskOrEvent).optional().describe("Filter by task or event"),
            keyword: z.string().optional().describe("Search keyword in task name or context"),
        }),
        execute: async (params) => fetchTasks(params),
    }),

    getTaskDetails: tool({
        description: "Get detailed information about a specific task by its ID",
        parameters: z.object({
            taskId: z.string().describe("The ID of the task to retrieve"),
        }),
        execute: async ({ taskId }) => fetchTaskById(taskId),
    }),

    createTask: tool({
        description: `Create a new task or event. Use sensible defaults - don't ask unnecessary questions.
Defaults: taskOrEvent=Task, subType=Chore, status=Open.
Rules:
- If isRecurring=true: must be Task (not Event), cannot set taskDueTime or plannedFor
- If taskOrEvent=Event: must provide eventStartTime, eventEndTime, and eventApprovalStatus`,
        parameters: z.object({
            taskName: z.string().describe("Name/title of the task"),
            taskOrEvent: z.nativeEnum(TaskOrEvent).describe("Task or Event. Default to Task."),
            subType: z.nativeEnum(SubType).describe("Fun, Text response, Chore, or Errand. Default to Chore."),
            status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN).describe("Task status, defaults to Open"),
            isRecurring: z.boolean().default(false).describe("True if task repeats"),
            userNotes: z.string().optional().describe("Additional notes or context"),
            taskDueTime: z.string().optional().describe("Due date/time in ISO format. Cannot set if isRecurring."),
            eventStartTime: z.string().optional().describe("Event start time in ISO. Required if Event."),
            eventEndTime: z.string().optional().describe("Event end time in ISO. Required if Event."),
            eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional().describe("Required if Event."),
            plannedFor: z.nativeEnum(PlannedFor).optional().describe("Today, Tomorrow, This Week. Cannot set if isRecurring."),
            tags: z.array(z.string()).optional().describe("Tags for the task"),
        }),
        execute: async (params) => {
            try {
                // Recurring tasks must have source=User per backend rules
                const source = params.isRecurring ? Source.USER : Source.AGENT;
                const taskData = {
                    ...params,
                    source,
                    taskDueTime: params.taskDueTime ? new Date(params.taskDueTime) : undefined,
                    eventStartTime: params.eventStartTime ? new Date(params.eventStartTime) : undefined,
                    eventEndTime: params.eventEndTime ? new Date(params.eventEndTime) : undefined,
                };
                return await createTask(taskData);
            } catch (error) {
                console.error("createTask error:", error);
                throw error;
            }
        },
    }),

    updateTask: tool({
        description: `Update an existing task. Always fetch task first with getTaskDetails to get current values.
Rules:
- If task.isRecurring=true: cannot set taskDueTime or plannedFor, cannot change to Event
- If taskOrEvent=Event: must have eventStartTime, eventEndTime, and eventApprovalStatus`,
        parameters: z.object({
            taskId: z.string().describe("The ID of the task to update"),
            taskName: z.string().optional().describe("Updated name/title"),
            taskOrEvent: z.nativeEnum(TaskOrEvent).describe("Task or Event"),
            subType: z.nativeEnum(SubType).describe("Fun, Text response, Chore, or Errand"),
            status: z.nativeEnum(TaskStatus).describe("Task status. Set to Closed to complete."),
            userNotes: z.string().optional().describe("Updated notes"),
            taskDueTime: z.string().optional().describe("Due date/time in ISO. Cannot set if recurring."),
            eventStartTime: z.string().optional().describe("Event start time in ISO. Required if Event."),
            eventEndTime: z.string().optional().describe("Event end time in ISO. Required if Event."),
            eventApprovalStatus: z.nativeEnum(EventApprovalStatus).optional().describe("Required if Event."),
            plannedFor: z.nativeEnum(PlannedFor).optional().describe("Today, Tomorrow, This Week. Cannot set if recurring."),
            tags: z.array(z.string()).optional().describe("Tags for the task"),
        }),
        execute: async (params) => {
            const taskData = {
                ...params,
                taskDueTime: params.taskDueTime ? new Date(params.taskDueTime) : undefined,
                eventStartTime: params.eventStartTime ? new Date(params.eventStartTime) : undefined,
                eventEndTime: params.eventEndTime ? new Date(params.eventEndTime) : undefined,
            };
            return updateTask(taskData);
        },
    }),
};

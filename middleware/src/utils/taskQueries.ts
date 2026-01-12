import { Task as OsdkTask } from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { Environment, TaskFilters } from "shared";
import { convertOsdkTaskToTask } from "./taskConverter";
import type { Task } from "shared";

interface TasksPage {
    tasks: Task[];
    nextPageToken?: string;
}

function buildWhereConditions(filters: TaskFilters): Array<Record<string, unknown>> {
    const conditions: Array<Record<string, unknown>> = [{ environment: { $eq: Environment.PRODUCTION } }];

    if (filters.taskOrEvent) conditions.push({ taskOrEvent: { $eq: filters.taskOrEvent } });
    if (filters.status) conditions.push({ status: { $eq: filters.status } });
    if (filters.subType) conditions.push({ subType: { $eq: filters.subType } });
    if (filters.keyword) {
        conditions.push({
            $or: [
                { taskName: { $containsAllTerms: filters.keyword } },
                { taskContext: { $containsAllTerms: filters.keyword } },
            ],
        });
    }
    if (filters.updatedAfter) conditions.push({ updatedAt: { $gte: filters.updatedAfter } });
    if (filters.eventStartAfter) conditions.push({ eventStartTime: { $gte: filters.eventStartAfter } });
    if (filters.eventStartBefore) conditions.push({ eventStartTime: { $lte: filters.eventStartBefore } });
    if (filters.eventEndAfter) conditions.push({ eventEndTime: { $gte: filters.eventEndAfter } });
    if (filters.eventEndBefore) conditions.push({ eventEndTime: { $lte: filters.eventEndBefore } });

    return conditions;
}

/**
 * Fetch tasks with pagination support
 */
export async function fetchTasksPage(filters: TaskFilters): Promise<TasksPage> {
    const whereConditions = buildWhereConditions(filters);
    const tasksQuery = client(OsdkTask).where({ $and: whereConditions });
    const page = await tasksQuery.fetchPage({ $pageSize: 100 });

    return {
        tasks: page.data.map(convertOsdkTaskToTask),
        nextPageToken: page.nextPageToken,
    };
}

/**
 * Fetch tasks without pagination (for agent tool calls)
 */
export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
    const result = await fetchTasksPage(filters);
    return result.tasks;
}

/**
 * Fetch a single task by ID
 */
export async function fetchTaskById(taskId: string): Promise<Task> {
    const osdkTask = await client(OsdkTask).fetchOne(taskId);
    if (!osdkTask) {
        throw new Error(`Task with ID ${taskId} not found`);
    }
    return convertOsdkTaskToTask(osdkTask);
}

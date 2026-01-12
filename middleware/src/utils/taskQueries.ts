import { Task as OsdkTask } from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { Environment, TaskFilters } from "shared";
import { convertOsdkTaskToTask } from "./taskConverter";
import type { Task } from "shared";

/**
 * Shared utility to fetch tasks from Foundry with filters
 * Used by both the tasks controller and agent controller
 */
export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
    const whereConditions: Array<Record<string, unknown>> = [{ environment: { $eq: Environment.PRODUCTION } }];

    if (filters.taskOrEvent) {
        whereConditions.push({ taskOrEvent: { $eq: filters.taskOrEvent } });
    }
    if (filters.status) {
        whereConditions.push({ status: { $eq: filters.status } });
    }
    if (filters.subType) {
        whereConditions.push({ subType: { $eq: filters.subType } });
    }
    if (filters.keyword) {
        whereConditions.push({
            $or: [
                { taskName: { $containsAllTerms: filters.keyword } },
                { taskContext: { $containsAllTerms: filters.keyword } },
            ],
        });
    }
    if (filters.updatedAfter) {
        whereConditions.push({ updatedAt: { $gte: filters.updatedAfter } });
    }
    if (filters.eventStartAfter) {
        whereConditions.push({ eventStartTime: { $gte: filters.eventStartAfter } });
    }
    if (filters.eventStartBefore) {
        whereConditions.push({ eventStartTime: { $lte: filters.eventStartBefore } });
    }
    if (filters.eventEndAfter) {
        whereConditions.push({ eventEndTime: { $gte: filters.eventEndAfter } });
    }
    if (filters.eventEndBefore) {
        whereConditions.push({ eventEndTime: { $lte: filters.eventEndBefore } });
    }

    const tasksQuery = client(OsdkTask).where({ $and: whereConditions });
    const tasksPage = await tasksQuery.fetchPage({ $pageSize: 100 });
    const tasks = tasksPage.data.map(convertOsdkTaskToTask);

    return tasks;
}

/**
 * Shared utility to fetch a single task by ID
 */
export async function fetchTaskById(taskId: string): Promise<Task> {
    const osdkTask = await client(OsdkTask).fetchOne(taskId);
    if (!osdkTask) {
        throw new Error(`Task with ID ${taskId} not found`);
    }
    return convertOsdkTaskToTask(osdkTask);
}

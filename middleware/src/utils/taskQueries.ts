import { Task as OsdkTask } from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { Environment, TaskFilters } from "shared";
import { convertOsdkTaskToTask } from "./taskConverter";
import type { Task } from "shared";

/**
 * Shared utility to fetch tasks from Foundry with filters
 * Uses withProperties to derive chat display names per task
 */
export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
    const whereConditions: Array<Record<string, unknown>> = [{ environment: { $eq: Environment.PRODUCTION } }];

    if (filters.isRecurring !== undefined) {
        if (filters.isRecurring === false) {
            whereConditions.push({ $or: [{ isRecurring: { $eq: false } }, { isRecurring: { $isNull: true } }] });
        } else {
            whereConditions.push({ isRecurring: { $eq: true } });
        }
    }
    if (filters.taskOrEvent) {
        whereConditions.push({ taskOrEvent: { $eq: filters.taskOrEvent } });
    }
    if (filters.status) {
        whereConditions.push({ status: { $eq: filters.status } });
    }
    if (filters.subType) {
        whereConditions.push({ subType: { $eq: filters.subType } });
    }
    if (filters.chatId) {
        whereConditions.push({ chatIds: { $contains: filters.chatId } });
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

    const tasksWithChats = client(OsdkTask)
        .where({ $and: whereConditions })
        .withProperties({
            chatNames: (base) =>
                base.pivotTo("chat").aggregate("chatDisplayName:collectList"),
            chatMemberNames: (base) =>
                base.pivotTo("chat").pivotTo("users").aggregate("name:collectList"),
        });

    const tasksPage = await tasksWithChats.fetchPage({
        $pageSize: 100,
        $orderBy: { status: "desc", updatedAt: "desc" },
    });

    return (tasksPage.data ?? []).map((task: any) => {
        const chatNames: string[] = (task.chatNames ?? []).filter(Boolean);
        const memberNames: string[] = (task.chatMemberNames ?? []).filter(Boolean);
        // Use chat display names if available, fall back to member names
        const chats = chatNames.length > 0
            ? chatNames
            : memberNames.length > 0
                ? [memberNames.filter((n: string) => n !== "Andrew Rochat").join(", ")]
                : undefined;
        return convertOsdkTaskToTask(task, chats);
    });
}

export async function fetchTaskById(taskId: string): Promise<Task> {
    const taskWithChats = client(OsdkTask)
        .where({ taskId: { $eq: taskId } })
        .withProperties({
            chatNames: (base) =>
                base.pivotTo("chat").aggregate("chatDisplayName:collectList"),
            chatMemberNames: (base) =>
                base.pivotTo("chat").pivotTo("users").aggregate("name:collectList"),
        });

    const page = await taskWithChats.fetchPage({ $pageSize: 1 });
    const task = (page.data ?? [])[0] as any;
    if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
    }

    const chatNames: string[] = (task.chatNames ?? []).filter(Boolean);
    const memberNames: string[] = (task.chatMemberNames ?? []).filter(Boolean);
    const chats = chatNames.length > 0
        ? chatNames
        : memberNames.length > 0
            ? [memberNames.filter((n: string) => n !== "Andrew Rochat").join(", ")]
            : undefined;
    return convertOsdkTaskToTask(task, chats);
}

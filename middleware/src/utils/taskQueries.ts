import { Task as OsdkTask, Message, User, Chat } from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { Environment, TaskFilters } from "shared";
import { convertOsdkTaskToTask } from "./taskConverter";
import type { Task } from "shared";
import { Osdk } from "@osdk/api";

/**
 * Shared utility to fetch tasks from Foundry with filters
 * Used by both the tasks controller and agent controller
 */
export async function fetchTasks(filters: TaskFilters): Promise<Task[]> {
    const whereConditions: Array<Record<string, unknown>> = [{ environment: { $eq: Environment.PRODUCTION } }];

    // exclude is recurring unless it's specifically requested
    if (filters.isRecurring == true) {
        whereConditions.push({ isRecurring: { $eq: true } });
    } else {
        whereConditions.push({ isRecurring: { $ne: true } });
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
    const linkedChatsQuery = tasksQuery.pivotTo("chat");
    const linkedUsersQuery = linkedChatsQuery.pivotTo("users");

    // opens before closed, and then newest to oldest
    const tasksPromise = tasksQuery.fetchPage({
        $pageSize: 100,
        $orderBy: { status: "desc", updatedAt: "desc" },
    });

    const [tasksPage, linkedChatsPage, linkedUsersPage] = await Promise.all([
        tasksPromise,
        linkedChatsQuery.fetchPage({ $pageSize: 100 }),
        linkedUsersQuery.fetchPage({ $pageSize: 100 }),
    ]);

    const chatMap = createChatMap(linkedChatsPage.data ?? [], linkedUsersPage.data ?? []);

    return taskConverterWrapper(tasksPage.data ?? [], chatMap);
}

export async function fetchTaskById(taskId: string): Promise<Task> {
    const [osdkTask, linkedChatsPage, linkedUsersPage] = await Promise.all([
        client(OsdkTask).fetchOne(taskId),
        client(OsdkTask).pivotTo("chat").fetchPage({ $pageSize: 100 }),
        client(OsdkTask).pivotTo("chat").pivotTo("users").fetchPage({ $pageSize: 100 }),
    ]);
    if (!osdkTask) {
        throw new Error(`Task with ID ${taskId} not found`);
    }

    const chatMap = createChatMap(linkedChatsPage.data ?? [], linkedUsersPage.data ?? []);

    return taskConverterWrapper([osdkTask], chatMap)[0];
}

function createChatMap(chats: Osdk.Instance<Chat>[], users: Osdk.Instance<User>[]): Map<string, string> {
    const userMap = new Map<string, string | undefined>(users.map((user) => [user.userId, user.name]));

    const chatMap = new Map<string, string>();
    chats.forEach((chat) => {
        const chatName = chat.chatDisplayName;
        if (chatName) {
            chatMap.set(chat.chatId, chatName);
        } else {
            const participantNames = (chat.userIds ?? [])
                .filter((userId) => userId !== "+19144177189")
                .map((userId) => userMap.get(userId) ?? userId);
            chatMap.set(chat.chatId, participantNames.join(", "));
        }
    });
    return chatMap;
}

function taskConverterWrapper(osdkTasks: Osdk.Instance<OsdkTask>[], chatMap: Map<string, string>): Task[] {
    return osdkTasks.map((task) => {
        const chats = task.chatIds?.map((chatId) => chatMap.get(chatId) ?? "Chat not found");
        return convertOsdkTaskToTask(task, chats);
    });
}

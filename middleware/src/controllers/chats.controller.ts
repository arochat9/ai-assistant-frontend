import { Request, Response } from "express";
import { Chat as OsdkChat, Message as OsdkMessage, User as OsdkUser } from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import {
    ChatFilters,
    ChatsResponse,
    Chat,
    ChatMember,
    ChatDetailResponse,
    ChatMessagesFilters,
    ChatMessagesResponse,
    MessageWithContext,
    MessagesMetricsResponse,
    MessagesMetrics,
    Environment,
    TaskStatus,
} from "shared";

const MY_USER_ID = "+19144177189";
const MY_NAME = "Andrew Rochat (Me)";

async function collectAsync<T>(iter: AsyncIterable<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of iter) {
        items.push(item);
    }
    return items;
}

function buildMembers(userIds: string[], nameMap: Map<string, string>): ChatMember[] {
    return userIds.map((id) => ({ userId: id, name: nameMap.get(id) ?? id })).filter((m) => m.userId !== MY_USER_ID);
}

function filterMyName(names: string[]): string[] {
    return names.filter((n) => n && n !== MY_NAME);
}

function buildDisplayName(chat: any, members: ChatMember[]): string {
    return chat.chatDisplayName || filterMyName(members.map((m) => m.name ?? m.userId)).join(", ") || "Unknown Chat";
}

/**
 * POST /api/chats
 * List all chats sorted by most recent message, with open task counts
 */
export async function getChats(req: Request, res: Response) {
    try {
        const { keyword }: ChatFilters = req.body;

        const chatsOS = client(OsdkChat)
            .where({ environment: { $eq: Environment.PRODUCTION } })
            .withProperties({
                lastMessageTime: (base) => base.pivotTo("messages").aggregate("timeReceived:max"),
                lastMessagePreview: (base) =>
                    base.pivotTo("messages").aggregate("textContent:collectList", { limit: 1 }),
                openTaskCount: (base) =>
                    base
                        .pivotTo("tasks")
                        .where({
                            $and: [
                                { status: { $eq: TaskStatus.OPEN } },
                                { environment: { $eq: Environment.PRODUCTION } },
                            ],
                        })
                        .aggregate("$count"),
            });

        const usersOS = client(OsdkUser);
        const [chatsPage, users] = await Promise.all([
            chatsOS.fetchPage({ $pageSize: 200, $orderBy: { updatedAt: "desc" } }),
            collectAsync(usersOS.asyncIter()),
        ]);

        // Build nameMap from users for all userIds in chats
        const allUserIds = new Set<string>();
        (chatsPage.data ?? []).forEach((chat) => {
            (chat.userIds ?? []).forEach((id: string) => allUserIds.add(id));
        });
        const nameMap = new Map<string, string>();
        users.forEach((user) => {
            if (allUserIds.has(user.userId) && user.name) {
                nameMap.set(user.userId, user.name);
            }
        });

        let chats: Chat[] = (chatsPage.data ?? []).map((chat) => {
            const members = buildMembers(chat.userIds ?? [], nameMap);
            const previewList = chat.lastMessagePreview;
            const previewText = Array.isArray(previewList) ? previewList[0] : previewList;
            const previewStr =
                typeof previewText === "string"
                    ? previewText.substring(0, 100) + (previewText.length > 100 ? "..." : "")
                    : undefined;

            return {
                chatId: chat.chatId,
                displayName: buildDisplayName(chat, members),
                chatType: chat.chatType,
                members,
                lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined,
                lastMessagePreview: previewStr,
                openTaskCount: chat.openTaskCount ?? 0,
            };
        });

        chats.sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        });

        if (keyword) {
            const lower = keyword.toLowerCase();
            chats = chats.filter(
                (c) =>
                    c.displayName.toLowerCase().includes(lower) ||
                    c.members.some((m) => m.name.toLowerCase().includes(lower)),
            );
        }

        return res.json({ chats } as ChatsResponse);
    } catch (error) {
        console.error("Error fetching chats:", error);
        const msg = error instanceof Error ? error.message : "Failed to fetch chats";
        return res.status(500).json({ error: "Failed to fetch chats", details: msg });
    }
}

/**
 * POST /api/chats/:id/messages
 * Get paginated messages for a specific chat
 */
export async function getChatMessages(req: Request, res: Response) {
    try {
        const chatId = req.params.id;
        const { pageSize = 50, pageToken }: ChatMessagesFilters = req.body;

        const fetchOptions: Record<string, unknown> = {
            $pageSize: pageSize,
            $orderBy: { timeReceived: "desc" },
            ...(pageToken && { $nextPageToken: pageToken }),
        };

        const page = await client(OsdkMessage)
            .where({ $and: [{ chatId: { $eq: chatId } }, { environment: { $eq: Environment.PRODUCTION } }] })
            .fetchPage(fetchOptions as any);

        const messages: MessageWithContext[] = (page.data ?? []).map((msg) => ({
            messageId: msg.messageId,
            content: msg.textContent ?? "",
            senderName: msg.senderName ?? msg.userId ?? "Unknown",
            repliedToId: msg.repliedToFk,
            chatId: msg.chatId ?? chatId,
            timeReceived: msg.timeReceived ? new Date(msg.timeReceived) : undefined,
            isFromMe: msg.isFromMe ?? false,
        }));

        return res.json({ messages, nextPageToken: page.nextPageToken } as ChatMessagesResponse);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        const msg = error instanceof Error ? error.message : "Failed to fetch chat messages";
        return res.status(500).json({ error: "Failed to fetch chat messages", details: msg });
    }
}

/**
 * GET /api/chats/:id/detail
 * Get chat detail with description placeholder
 */
export async function getChatDetail(req: Request, res: Response) {
    try {
        const chatId = req.params.id;

        const chatOS = client(OsdkChat)
            .where({ chatId: { $eq: chatId } })
            .withProperties({
                openTaskCount: (base) =>
                    base
                        .pivotTo("tasks")
                        .where({
                            $and: [
                                { status: { $eq: TaskStatus.OPEN } },
                                { environment: { $eq: Environment.PRODUCTION } },
                            ],
                        })
                        .aggregate("$count"),
            });

        const [chatPage, users] = await Promise.all([
            chatOS.fetchPage({ $pageSize: 1 }),
            collectAsync(chatOS.pivotTo("users").asyncIter()),
        ]);

        const osdkChat = (chatPage.data ?? [])[0] as any;
        if (!osdkChat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const nameMap = new Map<string, string>();
        users.forEach((user) => {
            if (user.name) nameMap.set(user.userId, user.name);
        });
        const members = buildMembers(osdkChat.userIds ?? [], nameMap);
        const chat: Chat = {
            chatId,
            displayName: buildDisplayName(osdkChat, members),
            chatType: osdkChat.chatType,
            members,
            openTaskCount: osdkChat.openTaskCount ?? 0,
        };
        const description = `Chat with ${members.map((m) => m.name).join(", ")}`;
        return res.json({ chat, description } as ChatDetailResponse);
    } catch (error) {
        console.error("Error fetching chat detail:", error);
        const msg = error instanceof Error ? error.message : "Failed to fetch chat detail";
        return res.status(500).json({ error: "Failed to fetch chat detail", details: msg });
    }
}

/**
 * GET /api/messages/metrics
 * Get message metrics (counts by time period, most active chat)
 */
export async function getMessagesMetrics(_req: Request, res: Response) {
    try {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const last365Days = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

        const baseQuery = client(OsdkMessage).where({ environment: { $eq: Environment.PRODUCTION } });

        const [weekCount, monthCount, yearCount, chatsPage] = await Promise.all([
            baseQuery.where({ timeReceived: { $gte: last7Days } }).aggregate({ $select: { $count: "unordered" } }),
            baseQuery.where({ timeReceived: { $gte: last30Days } }).aggregate({ $select: { $count: "unordered" } }),
            baseQuery.where({ timeReceived: { $gte: last365Days } }).aggregate({ $select: { $count: "unordered" } }),
            client(OsdkChat)
                .where({ environment: { $eq: Environment.PRODUCTION } })
                .withProperties({
                    weekMsgCount: (base) =>
                        base
                            .pivotTo("messages")
                            .where({ timeReceived: { $gte: last7Days } })
                            .aggregate("$count"),
                    monthMsgCount: (base) =>
                        base
                            .pivotTo("messages")
                            .where({ timeReceived: { $gte: last30Days } })
                            .aggregate("$count"),
                    yearMsgCount: (base) =>
                        base
                            .pivotTo("messages")
                            .where({ timeReceived: { $gte: last365Days } })
                            .aggregate("$count"),
                })
                .fetchPage({ $pageSize: 200 }),
        ]);

        const chats = (chatsPage.data ?? []) as any[];

        const allUserIds = new Set<string>();
        for (const chat of chats) {
            for (const id of chat.userIds ?? []) allUserIds.add(id);
        }
        // Load all users for metrics
        const usersOS = client(OsdkUser).where({ userId: { $in: [...allUserIds] } });
        const users = await collectAsync(usersOS.asyncIter());
        const nameMap = new Map<string, string>();
        users.forEach((user) => {
            if (user.name) nameMap.set(user.userId, user.name);
        });

        const findTopChat = (countKey: string): MessagesMetrics["mostActiveWeek"] => {
            let top: any = null;
            for (const chat of chats) {
                if ((chat[countKey] ?? 0) > (top?.[countKey] ?? 0)) top = chat;
            }
            if (!top || (top[countKey] ?? 0) === 0) return null;
            const members = buildMembers(top.userIds ?? [], nameMap);
            const name = top.chatDisplayName || filterMyName(members.map((m) => m.name)).join(", ") || "Unknown";
            return { chatId: top.chatId, displayName: name, messageCount: top[countKey] };
        };

        const metrics: MessagesMetrics = {
            sentThisWeek: weekCount.$count,
            sentThisMonth: monthCount.$count,
            sentThisYear: yearCount.$count,
            mostActiveWeek: findTopChat("weekMsgCount"),
            mostActiveMonth: findTopChat("monthMsgCount"),
            mostActiveYear: findTopChat("yearMsgCount"),
        };

        return res.json({ metrics } as MessagesMetricsResponse);
    } catch (error) {
        console.error("Error fetching message metrics:", error);
        const msg = error instanceof Error ? error.message : "Failed to fetch metrics";
        return res.status(500).json({ error: "Failed to fetch metrics", details: msg });
    }
}

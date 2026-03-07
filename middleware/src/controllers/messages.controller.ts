import { Request, Response } from "express";
import { Message as OsdkMessage } from "@ai-assistant-third-party-app/sdk";
import { Osdk } from "@osdk/client";
import { client } from "../config/foundry";
import { MessageFilters, MessagesResponse, Message } from "shared";

/**
 * POST endpoint that fetches messages by IDs
 * Body: MessageFilters
 */
export async function getMessages(req: Request, res: Response) {
    try {
        const { messageIds }: MessageFilters = req.body;

        if (!messageIds?.length) {
            return res.status(400).json({ error: "messageIds array is required" });
        }

        const osdkMessages: Osdk.Instance<OsdkMessage>[] = [];
        for await (const item of client(OsdkMessage)
            .where({ messageId: { $in: messageIds } })
            .asyncIter()) {
            osdkMessages.push(item);
        }

        const messages: Message[] = osdkMessages.map((msg) => ({
            messageId: msg.messageId,
            content: msg.textContent ?? "",
            senderName: msg.senderName ?? msg.userId ?? "Unknown",
            repliedToId: msg.repliedToFk,
        }));

        const response: MessagesResponse = { messages };
        return res.json(response);
    } catch (error) {
        console.error("Error fetching messages:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch messages";
        return res.status(500).json({ error: "Failed to fetch messages", details: errorMessage });
    }
}

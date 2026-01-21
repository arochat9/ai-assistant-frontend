import { Request, Response } from "express";
import { Task, Message } from "@ai-assistant-third-party-app/sdk";
import { Osdk } from "@osdk/client";
import { client } from "../config/foundry";
import { TaskChangelogFilters, TaskChangelogsResponse } from "shared";
import type { TaskChangelog as TaskChangelogType } from "shared";

export async function getMessages(req: Request, res: Response) {
    const messages = await Array.fromAsync(
        client(Message)
            .where({
                messageId: { $in: ["msg1", "msg2", "msg3"] },
            })
            .asyncIter(),
    );
}

import { Request, Response } from "express";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { TaskStatus, SubType, TaskOrEvent } from "shared";
import { fetchTasks, fetchTaskById } from "../utils/taskQueries";

const SYSTEM_PROMPT = `You are a helpful task management assistant. You help users view and understand their tasks.
When users ask about their tasks, use the getTasks tool to retrieve them.
When users ask about a specific task, use the getTaskDetails tool.
Be conversational, friendly, and concise. Format task information clearly.
Current date: ${new Date().toLocaleDateString()}`;

const tools = {
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
};

/**
 * POST /api/agent/chat
 * Streaming chat endpoint compatible with Vercel AI SDK useChat hook
 */
export async function chat(req: Request, res: Response) {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const result = streamText({
            model: openai("gpt-4-turbo"),
            system: SYSTEM_PROMPT,
            messages,
            tools,
            maxSteps: 5,
        });

        result.pipeDataStreamToResponse(res);
    } catch (error) {
        console.error("Agent chat error:", error);
        return res.status(500).json({ error: "Chat failed" });
    }
}

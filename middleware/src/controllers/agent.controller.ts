import { Request, Response } from "express";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { agentTools } from "../utils/agentTools";

const getSystemPrompt =
    () => `You are a helpful task management assistant. You help users view, create, and manage their tasks.

IMPORTANT: Do NOT ask unnecessary questions. Use sensible defaults and just create/update tasks.
- isRecurring is just a boolean flag (true/false) - there is NO schedule configuration. Don't ask about frequency.
- Default subType to "Chore" unless clearly something else
- Default taskOrEvent to "Task" unless it's clearly an event with a specific time

When users ask about their tasks, use the getTasks tool. Always filter to status "Open" by default.
When users want to create a task, just create it with the info provided. Don't ask for more details unless absolutely necessary.
When users want to update or complete a task, first fetch it with getTaskDetails, then use updateTask.

Be concise. Current date: ${new Date().toLocaleDateString()}`;

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
            system: getSystemPrompt(),
            messages,
            tools: agentTools,
            maxSteps: 5,
        });

        result.pipeDataStreamToResponse(res);
    } catch (error) {
        console.error("Agent chat error:", error);
        return res.status(500).json({ error: "Chat failed" });
    }
}

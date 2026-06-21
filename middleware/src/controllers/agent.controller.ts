import { Request, Response } from "express";
import { zodToJsonSchema } from "zod-to-json-schema";
import { agentTools } from "../utils/agentTools";

const CONCENTRATE_API_URL = "https://api.concentrate.ai/v1/responses/";
const CONCENTRATE_MODEL = "gpt-4.1";

const getSystemPrompt =
    () => `You are a helpful task management assistant. You help users view, create, and manage their tasks.

IMPORTANT: Do NOT ask unnecessary questions. Use sensible defaults and just create/update tasks.
- isRecurring is just a boolean flag (true/false) - there is NO schedule configuration. Don't ask about frequency.
- Default subType to "Chore" unless clearly something else
- Default taskOrEvent to "Task" unless it's clearly an event with a specific time

FETCHING TASKS:
- Use the getTasks tool when users ask about their tasks. Only set status to "Open" by default.
- ONLY pass filters the user explicitly mentioned. Do NOT set subType, keyword, or taskOrEvent unless the user specifically asked to filter by them.
- If the user says "events", set taskOrEvent to "Event". If they say "tasks", set taskOrEvent to "Task". Otherwise leave it unset.
- Never pass an empty string for keyword.

When users want to create a task, just create it with the info provided. Don't ask for more details unless absolutely necessary.
When users want to update or complete a task, first fetch it with getTaskDetails, then use updateTask.

Be concise. Current date: ${new Date().toLocaleDateString()}`;

function getConcentrateTools() {
    return Object.entries(agentTools).map(([name, t]) => {
        const toolDef = t as { description?: string; parameters?: unknown };
        const { $schema, ...params } = zodToJsonSchema(
            toolDef.parameters as Parameters<typeof zodToJsonSchema>[0],
        ) as Record<string, unknown>;
        return {
            type: "function" as const,
            name,
            description: toolDef.description || "",
            parameters: params,
            strict: false,
        };
    });
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const toolDef = (
        agentTools as unknown as Record<string, { execute?: (args: unknown, opts: unknown) => Promise<unknown> }>
    )[name];
    if (!toolDef?.execute) throw new Error(`Unknown tool: ${name}`);
    return toolDef.execute(args, {});
}

interface FunctionCall {
    type: "function_call";
    call_id: string;
    name: string;
    arguments: string;
}

async function parseConcentrateStream(
    response: globalThis.Response,
    onText: (text: string) => void,
    onFunctionCall: (fc: FunctionCall) => void,
) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    const calls: Record<string, { name: string; callId: string; args: string }> = {};

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
                const e = JSON.parse(line.slice(6));
                const itemId = e.item_id || e.item?.id || e.output_index?.toString() || "0";

                if (e.type === "response.output_text.delta" && e.delta) {
                    onText(e.delta);
                } else if (e.type === "response.output_item.added" && e.item?.type === "function_call") {
                    calls[itemId] = { name: e.item.name, callId: e.item.call_id, args: "" };
                } else if (e.type === "response.function_call_arguments.delta") {
                    if (calls[itemId]) calls[itemId].args += e.delta || "";
                } else if (e.type === "response.function_call_arguments.done") {
                    const call = calls[itemId];
                    onFunctionCall({
                        type: "function_call",
                        call_id: call?.callId || e.call_id || itemId,
                        name: call?.name || e.name || "",
                        arguments: e.arguments || call?.args || "{}",
                    });
                }
            } catch {
                // Skip malformed SSE lines
            }
        }
    }
}

// Write a Vercel AI SDK data stream chunk
function writeChunk(res: Response, prefix: string, data: unknown) {
    res.write(`${prefix}:${JSON.stringify(data)}\n`);
}

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

        const apiKey = process.env.CONCENTRATE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "CONCENTRATE_API_KEY not configured" });
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("X-Vercel-AI-Data-Stream", "v1");

        const tools = getConcentrateTools();
        const conversationInput: unknown[] = messages.map((m: { role: string; content: string }) => ({
            role: m.role === "system" ? "developer" : m.role,
            content: m.content,
        }));

        for (let step = 0; step < 5; step++) {
            const response = await fetch(CONCENTRATE_API_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: CONCENTRATE_MODEL,
                    instructions: getSystemPrompt(),
                    input: conversationInput,
                    tools,
                    stream: true,
                    temperature: 0,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Concentrate API error:", response.status, errorText);
                writeChunk(res, "3", `Concentrate API error: ${response.status}`);
                break;
            }

            const pendingCalls: FunctionCall[] = [];
            await parseConcentrateStream(
                response,
                (text) => writeChunk(res, "0", text),
                (fc) => pendingCalls.push(fc),
            );

            if (pendingCalls.length === 0) break;

            for (const fc of pendingCalls) {
                const args = JSON.parse(fc.arguments);
                const toolCallId = fc.call_id;

                writeChunk(res, "9", { toolCallId, toolName: fc.name, args });
                console.log(`[Tool Call] ${fc.name}`, JSON.stringify(args, null, 2));

                let result: unknown;
                try {
                    result = await executeTool(fc.name, args);
                } catch (error) {
                    console.error(`Tool ${fc.name} error:`, error);
                    result = { error: error instanceof Error ? error.message : "Tool execution failed" };
                }

                writeChunk(res, "a", { toolCallId, toolName: fc.name, args, result });
                conversationInput.push(fc);
                conversationInput.push({
                    type: "function_call_output",
                    call_id: fc.call_id,
                    output: JSON.stringify(result),
                });
            }

            writeChunk(res, "e", {
                finishReason: "tool-calls",
                usage: { promptTokens: 0, completionTokens: 0 },
                isContinued: true,
            });
        }

        writeChunk(res, "d", { finishReason: "stop", usage: { promptTokens: 0, completionTokens: 0 } });
        res.end();
    } catch (error) {
        console.error("Agent chat error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Chat failed" });
        }
        res.end();
    }
}

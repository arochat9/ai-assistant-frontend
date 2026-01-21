import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { fetchTasks, fetchTaskById } from "./taskQueries";
import { createTask, updateTask } from "./taskMutations";
import { TaskStatus, SubType, TaskOrEvent, Source, EventApprovalStatus, PlannedFor } from "shared";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";

// Tool definitions for OpenAI Realtime API format
const realtimeTools = [
    {
        type: "function",
        name: "getTasks",
        description: "Get tasks with optional filters. Use when user asks about tasks, to-dos, or their schedule.",
        parameters: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: Object.values(TaskStatus),
                    description: "Filter by status. Default to Open since there are many closed tasks.",
                },
                subType: {
                    type: "string",
                    enum: Object.values(SubType),
                    description: "Filter by task subtype",
                },
                taskOrEvent: {
                    type: "string",
                    enum: Object.values(TaskOrEvent),
                    description: "Filter by task or event",
                },
                keyword: {
                    type: "string",
                    description: "Search keyword in task name or context",
                },
            },
            required: [],
        },
    },
    {
        type: "function",
        name: "getTaskDetails",
        description: "Get detailed information about a specific task by its ID",
        parameters: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "The ID of the task to retrieve" },
            },
            required: ["taskId"],
        },
    },
    {
        type: "function",
        name: "createTask",
        description: `Create a new task or event. Use sensible defaults.
Defaults: taskOrEvent=Task, subType=Chore, status=Open.
Rules:
- If isRecurring=true: must be Task, cannot set taskDueTime or plannedFor
- If taskOrEvent=Event: must provide eventStartTime, eventEndTime`,
        parameters: {
            type: "object",
            properties: {
                taskName: { type: "string", description: "Name/title of the task" },
                taskOrEvent: { type: "string", enum: Object.values(TaskOrEvent), description: "Task or Event" },
                subType: {
                    type: "string",
                    enum: Object.values(SubType),
                    description: "Fun, Text response, Chore, or Errand",
                },
                status: { type: "string", enum: Object.values(TaskStatus), description: "Task status" },
                isRecurring: { type: "boolean", description: "True if task repeats" },
                userNotes: { type: "string", description: "Additional notes" },
                taskDueTime: { type: "string", description: "Due date/time in ISO format" },
                eventStartTime: { type: "string", description: "Event start time in ISO" },
                eventEndTime: { type: "string", description: "Event end time in ISO" },
                eventApprovalStatus: {
                    type: "string",
                    enum: Object.values(EventApprovalStatus),
                    description: "Event approval status",
                },
                plannedFor: {
                    type: "string",
                    enum: Object.values(PlannedFor),
                    description: "Today, Tomorrow, This Week",
                },
                tags: { type: "array", items: { type: "string" }, description: "Tags for the task" },
            },
            required: ["taskName", "taskOrEvent", "subType"],
        },
    },
    {
        type: "function",
        name: "updateTask",
        description: `Update an existing task. Always fetch task first with getTaskDetails.
Rules:
- If task.isRecurring=true: cannot set taskDueTime or plannedFor
- If taskOrEvent=Event: must have eventStartTime, eventEndTime`,
        parameters: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "The ID of the task to update" },
                taskName: { type: "string", description: "Updated name/title" },
                taskOrEvent: { type: "string", enum: Object.values(TaskOrEvent), description: "Task or Event" },
                subType: {
                    type: "string",
                    enum: Object.values(SubType),
                    description: "Fun, Text response, Chore, or Errand",
                },
                status: { type: "string", enum: Object.values(TaskStatus), description: "Task status" },
                userNotes: { type: "string", description: "Updated notes" },
                taskDueTime: { type: "string", description: "Due date/time in ISO" },
                eventStartTime: { type: "string", description: "Event start time in ISO" },
                eventEndTime: { type: "string", description: "Event end time in ISO" },
                eventApprovalStatus: {
                    type: "string",
                    enum: Object.values(EventApprovalStatus),
                    description: "Event approval status",
                },
                plannedFor: {
                    type: "string",
                    enum: Object.values(PlannedFor),
                    description: "Today, Tomorrow, This Week",
                },
                tags: { type: "array", items: { type: "string" }, description: "Tags for the task" },
            },
            required: ["taskId", "taskOrEvent", "subType", "status"],
        },
    },
];

// Strip WAV header from base64 WAV data to get raw PCM
function stripWavHeader(wavBase64: string): string {
    const wavBuffer = Buffer.from(wavBase64, "base64");

    // Find "data" chunk - WAV header ends there
    // Standard WAV header is 44 bytes but can vary
    let dataOffset = 44;

    // Search for "data" marker
    for (let i = 0; i < Math.min(wavBuffer.length - 4, 100); i++) {
        if (
            wavBuffer[i] === 0x64 && // 'd'
            wavBuffer[i + 1] === 0x61 && // 'a'
            wavBuffer[i + 2] === 0x74 && // 't'
            wavBuffer[i + 3] === 0x61 // 'a'
        ) {
            // Skip "data" + 4 bytes for chunk size
            dataOffset = i + 8;
            break;
        }
    }

    // Extract PCM data after header
    const pcmData = wavBuffer.subarray(dataOffset);
    return pcmData.toString("base64");
}

// Execute tool calls
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    console.log(`[Realtime] Executing tool: ${name}`, args);

    try {
        switch (name) {
            case "getTasks":
                const tasks = await fetchTasks(args);
                return JSON.stringify(tasks);

            case "getTaskDetails":
                const task = await fetchTaskById(args.taskId as string);
                return JSON.stringify(task);

            case "createTask": {
                const source = args.isRecurring ? Source.USER : Source.AGENT;
                const taskData = {
                    taskName: args.taskName as string,
                    taskOrEvent: (args.taskOrEvent as TaskOrEvent) || TaskOrEvent.TASK,
                    subType: (args.subType as SubType) || SubType.CHORE,
                    status: (args.status as TaskStatus) || TaskStatus.OPEN,
                    isRecurring: (args.isRecurring as boolean) || false,
                    source,
                    userNotes: args.userNotes as string | undefined,
                    taskDueTime: args.taskDueTime ? new Date(args.taskDueTime as string) : undefined,
                    eventStartTime: args.eventStartTime ? new Date(args.eventStartTime as string) : undefined,
                    eventEndTime: args.eventEndTime ? new Date(args.eventEndTime as string) : undefined,
                    eventApprovalStatus: args.eventApprovalStatus as EventApprovalStatus | undefined,
                    plannedFor: args.plannedFor as PlannedFor | undefined,
                    tags: args.tags as string[] | undefined,
                };
                const created = await createTask(taskData);
                return JSON.stringify(created);
            }

            case "updateTask": {
                const updateData = {
                    taskId: args.taskId as string,
                    taskName: args.taskName as string | undefined,
                    taskOrEvent: args.taskOrEvent as TaskOrEvent,
                    subType: args.subType as SubType,
                    status: args.status as TaskStatus,
                    userNotes: args.userNotes as string | undefined,
                    taskDueTime: args.taskDueTime ? new Date(args.taskDueTime as string) : undefined,
                    eventStartTime: args.eventStartTime ? new Date(args.eventStartTime as string) : undefined,
                    eventEndTime: args.eventEndTime ? new Date(args.eventEndTime as string) : undefined,
                    eventApprovalStatus: args.eventApprovalStatus as EventApprovalStatus | undefined,
                    plannedFor: args.plannedFor as PlannedFor | undefined,
                    tags: args.tags as string[] | undefined,
                };
                const updated = await updateTask(updateData);
                return JSON.stringify(updated);
            }

            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` });
        }
    } catch (error) {
        console.error(`[Realtime] Tool error:`, error);
        return JSON.stringify({ error: error instanceof Error ? error.message : "Tool execution failed" });
    }
}

export function setupRealtimeWebSocket(wss: WebSocketServer) {
    wss.on("connection", (clientWs: WebSocket, req: IncomingMessage) => {
        console.log("[Realtime] Client connected");

        if (!OPENAI_API_KEY) {
            clientWs.send(JSON.stringify({ type: "error", message: "OpenAI API key not configured" }));
            clientWs.close();
            return;
        }

        // Connect to OpenAI Realtime API
        const openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1",
            },
        });

        let sessionConfigured = false;

        openaiWs.on("open", () => {
            console.log("[Realtime] Connected to OpenAI");

            // Configure session with tools
            const sessionConfig = {
                type: "session.update",
                session: {
                    modalities: ["text", "audio"],
                    instructions: `You are a helpful AI assistant that manages tasks and schedules.
You can create, update, and query tasks. Be concise and natural in conversation.
When creating tasks, use sensible defaults. Today's date is ${new Date().toLocaleDateString()}.
For recurring tasks, just set isRecurring=true - no need to configure frequency.`,
                    voice: "alloy",
                    input_audio_format: "pcm16",
                    output_audio_format: "pcm16",
                    input_audio_transcription: { model: "whisper-1" },
                    turn_detection: null, // Disable VAD - we use manual push-to-talk
                    tools: realtimeTools,
                },
            };
            openaiWs.send(JSON.stringify(sessionConfig));
            sessionConfigured = true;
        });

        openaiWs.on("message", async (data: Buffer) => {
            try {
                const event = JSON.parse(data.toString());

                // Handle function calls
                if (event.type === "response.function_call_arguments.done") {
                    const { call_id, name, arguments: argsStr } = event;
                    const args = JSON.parse(argsStr);

                    const result = await executeTool(name, args);

                    // Send function result back to OpenAI
                    openaiWs.send(
                        JSON.stringify({
                            type: "conversation.item.create",
                            item: {
                                type: "function_call_output",
                                call_id,
                                output: result,
                            },
                        }),
                    );

                    // Trigger response generation with audio
                    openaiWs.send(
                        JSON.stringify({
                            type: "response.create",
                            response: { modalities: ["text", "audio"] },
                        }),
                    );

                    // Notify client about tool execution
                    clientWs.send(
                        JSON.stringify({
                            type: "tool_executed",
                            name,
                            args,
                        }),
                    );
                }
                // Forward audio and relevant events to client
                else if (
                    event.type === "response.audio.delta" ||
                    event.type === "response.audio.done" ||
                    event.type === "response.audio_transcript.delta" ||
                    event.type === "response.audio_transcript.done" ||
                    event.type === "response.done"
                ) {
                    if (event.type === "response.audio.delta") {
                        console.log(`[Realtime] Audio delta: ${event.delta?.length || 0} chars`);
                    } else {
                        console.log(`[Realtime] Forwarding: ${event.type}`);
                    }
                    clientWs.send(JSON.stringify(event));
                }
                // Handle errors with full details
                else if (event.type === "error") {
                    console.error("[Realtime] OpenAI error:", JSON.stringify(event, null, 2));
                    clientWs.send(
                        JSON.stringify({
                            type: "error",
                            message: event.error?.message || event.message || "Unknown error",
                            code: event.error?.code,
                        }),
                    );
                }
                // Log session events with details
                else if (event.type === "session.created") {
                    console.log(
                        `[Realtime] ${event.type}:`,
                        JSON.stringify(event.session?.modalities || event.session, null, 2),
                    );
                    clientWs.send(JSON.stringify({ type: "session_ready" }));
                } else if (event.type === "session.updated") {
                    console.log(
                        `[Realtime] ${event.type}:`,
                        JSON.stringify(event.session?.modalities || event.session, null, 2),
                    );
                    // Don't send session_ready again - already sent on session.created
                }
                // Log response events with details for debugging
                else if (event.type.startsWith("response.")) {
                    if (event.type === "response.created") {
                        console.log(
                            `[Realtime] Event: ${event.type}`,
                            JSON.stringify(event.response?.modalities, null, 2),
                        );
                    } else if (event.type === "response.output_item.added") {
                        console.log(`[Realtime] Event: ${event.type}`, JSON.stringify(event.item, null, 2));
                    } else if (event.type === "response.content_part.added") {
                        console.log(`[Realtime] Event: ${event.type}`, JSON.stringify(event.part, null, 2));
                    } else if (event.type === "response.content_part.done") {
                        console.log(`[Realtime] Event: ${event.type}`, JSON.stringify(event.part?.type, null, 2));
                    } else if (event.type === "response.done") {
                        console.log(`[Realtime] Event: ${event.type} status:`, event.response?.status);
                    } else if (event.type === "response.audio.delta") {
                        console.log(`[Realtime] Audio delta received: ${event.delta?.length || 0} chars`);
                    } else {
                        console.log(`[Realtime] Event: ${event.type}`);
                    }
                }
                // Log all other events
                else {
                    console.log(`[Realtime] Event: ${event.type}`);
                }
            } catch (error) {
                console.error("[Realtime] Error processing OpenAI message:", error);
            }
        });

        openaiWs.on("error", (error) => {
            console.error("[Realtime] OpenAI WebSocket error:", error);
            clientWs.send(JSON.stringify({ type: "error", message: "OpenAI connection error" }));
        });

        openaiWs.on("close", () => {
            console.log("[Realtime] OpenAI connection closed");
            clientWs.close();
        });

        // Forward client audio to OpenAI
        clientWs.on("message", (data: Buffer) => {
            if (!sessionConfigured) return;

            try {
                const message = JSON.parse(data.toString());

                if (message.type === "audio") {
                    // Client sends base64 WAV - need to strip header and send raw PCM
                    const wavBase64 = message.audio;
                    const pcmBase64 = stripWavHeader(wavBase64);

                    console.log(`[Realtime] Received audio: ${wavBase64.length} chars, PCM: ${pcmBase64.length} chars`);

                    openaiWs.send(
                        JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: pcmBase64,
                        }),
                    );
                } else if (message.type === "commit_audio") {
                    console.log("[Realtime] Committing audio buffer");
                    openaiWs.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
                    openaiWs.send(JSON.stringify({ type: "response.create" }));
                } else if (message.type === "cancel") {
                    openaiWs.send(JSON.stringify({ type: "response.cancel" }));
                }
            } catch {
                // Binary audio data - forward directly
                if (Buffer.isBuffer(data)) {
                    const base64Audio = data.toString("base64");
                    openaiWs.send(
                        JSON.stringify({
                            type: "input_audio_buffer.append",
                            audio: base64Audio,
                        }),
                    );
                }
            }
        });

        clientWs.on("close", () => {
            console.log("[Realtime] Client disconnected");
            openaiWs.close();
        });

        clientWs.on("error", (error) => {
            console.error("[Realtime] Client WebSocket error:", error);
            openaiWs.close();
        });
    });
}

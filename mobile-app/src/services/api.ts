import axios from "axios";
import type {
    TaskFilters,
    TasksResponse,
    TaskResponse,
    CreateTaskInput,
    UpdateTaskInput,
    TaskActionResponse,
    TaskChangelogFilters,
    TaskChangelogsResponse,
} from "../types";

// TODO: Update this to your actual API URL
// For development, use your local machine's IP address (not localhost)
// e.g., "http://192.168.1.100:3000" or your deployed URL
const API_BASE_URL = __DEV__
    ? "http://localhost:3000"  // Update with your machine's IP for physical device testing
    : "https://your-production-url.fly.dev";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically convert ISO date strings to Date objects in responses
api.interceptors.response.use(
    (response) => {
        const convertDates = (obj: unknown): unknown => {
            if (!obj || typeof obj !== "object") return obj;
            if (obj instanceof Date) return obj;
            if (Array.isArray(obj)) return obj.map(convertDates);

            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [
                    k,
                    typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : convertDates(v),
                ])
            );
        };

        response.data = convertDates(response.data);
        return response;
    },
    (error) => {
        // Extract user-facing error message from API response
        if (error.response?.data?.details) {
            error.message = error.response.data.details;
        }
        return Promise.reject(error);
    }
);

export const tasksApi = {
    // Get all tasks with optional filters
    getTasks: async (filters?: TaskFilters): Promise<TasksResponse> => {
        const response = await api.post<TasksResponse>("/api/tasks", filters || {});
        return response.data;
    },

    // Get a single task by ID
    getTaskById: async (id: string): Promise<TaskResponse> => {
        const response = await api.get<TaskResponse>(`/api/tasks/${id}`);
        return response.data;
    },

    // Create a new task
    createTask: async (taskData: CreateTaskInput): Promise<TaskActionResponse> => {
        const response = await api.post<TaskActionResponse>("/api/tasks/create", taskData);
        return response.data;
    },

    // Update an existing task
    updateTask: async (taskData: UpdateTaskInput): Promise<TaskActionResponse> => {
        const response = await api.put<TaskActionResponse>("/api/tasks/update", taskData);
        return response.data;
    },

    // Get task changelogs (history)
    getTaskChangelogs: async (filters?: TaskChangelogFilters): Promise<TaskChangelogsResponse> => {
        const response = await api.post<TaskChangelogsResponse>("/api/tasks/changelogs", filters || {});
        return response.data;
    },
};

// Agent API
export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ToolCall {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "call" | "result";
    result?: unknown;
}

export interface StreamCallbacks {
    onText: (text: string) => void;
    onToolCall: (toolCall: ToolCall) => void;
    onToolResult: (toolCallId: string, result: unknown) => void;
    onError: (error: Error) => void;
    onDone: () => void;
}

export const agentApi = {
    // Streaming chat using expo/fetch
    chatStream: async (messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> => {
        // Use expo/fetch for streaming support in React Native
        const { fetch: expoFetch } = await import("expo/fetch");

        try {
            const response = await expoFetch(`${API_BASE_URL}/api/agent/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Chat failed: ${response.status} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (!line.includes(":")) continue;
                    const colonIdx = line.indexOf(":");
                    const prefix = line.slice(0, colonIdx);
                    const jsonStr = line.slice(colonIdx + 1);

                    try {
                        const data = JSON.parse(jsonStr);

                        if (prefix === "0" && typeof data === "string") {
                            callbacks.onText(data);
                        } else if (prefix === "9" && data.toolCallId) {
                            callbacks.onToolCall({
                                toolCallId: data.toolCallId,
                                toolName: data.toolName,
                                args: data.args,
                                state: "call",
                            });
                        } else if (prefix === "a" && data.toolCallId) {
                            callbacks.onToolResult(data.toolCallId, data.result);
                        }
                    } catch {
                        // Skip malformed lines
                    }
                }
            }

            callbacks.onDone();
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        }
    },
};


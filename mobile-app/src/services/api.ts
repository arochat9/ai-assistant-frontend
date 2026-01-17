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

export interface ChatResponse {
    message: string;
    role: string;
}

export const agentApi = {
    chat: async (messages: ChatMessage[]): Promise<ChatResponse> => {
        const response = await api.post<ChatResponse>("/api/agent/chat", { messages });
        return response.data;
    },
};

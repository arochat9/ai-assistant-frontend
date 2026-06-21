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
    MessageFilters,
    MessagesResponse,
    ChatFilters,
    ChatsResponse,
    ChatMessagesFilters,
    ChatMessagesResponse,
    ChatDetailResponse,
    MessagesMetricsResponse,
} from "shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically convert ISO date strings to Date objects in responses
api.interceptors.response.use(
    (response) => {
        const convertDates = (obj: unknown, parentKey?: string, isInArray = false): unknown => {
            if (!obj || typeof obj !== "object") return obj;
            if (obj instanceof Date) return obj;
            if (Array.isArray(obj)) {
                return obj.map((item) => convertDates(item, parentKey, true));
            }

            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => {
                    // Don't convert oldValue/newValue in changelog objects - they're display strings
                    if ((k === "oldValue" || k === "newValue") && (parentKey === "changelogs" || isInArray)) {
                        return [k, v];
                    }
                    return [
                        k,
                        typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)
                            ? new Date(v)
                            : convertDates(v, k, isInArray),
                    ];
                })
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

export const messagesApi = {
    getMessages: async (filters: MessageFilters): Promise<MessagesResponse> => {
        const response = await api.post<MessagesResponse>("/api/messages", filters);
        return response.data;
    },
    getMetrics: async (): Promise<MessagesMetricsResponse> => {
        const response = await api.get<MessagesMetricsResponse>("/api/messages/metrics");
        return response.data;
    },
};

export const chatsApi = {
    getChats: async (filters?: ChatFilters): Promise<ChatsResponse> => {
        const response = await api.post<ChatsResponse>("/api/chats", filters || {});
        return response.data;
    },
    getChatMessages: async (chatId: string, filters?: ChatMessagesFilters): Promise<ChatMessagesResponse> => {
        const response = await api.post<ChatMessagesResponse>(`/api/chats/${chatId}/messages`, filters || {});
        return response.data;
    },
    getChatDetail: async (chatId: string): Promise<ChatDetailResponse> => {
        const response = await api.get<ChatDetailResponse>(`/api/chats/${chatId}/detail`);
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

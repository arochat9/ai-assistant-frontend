import { Request, Response } from "express";
import {
    TaskFilters,
    CreateTaskInput,
    UpdateTaskInput,
    CreateTaskSchema,
    UpdateTaskSchema,
    TasksResponse,
    TaskResponse,
} from "shared";
import { parseDateFields, normalizeOptionalFields } from "../utils/requestParser";
import { fetchTasks, fetchTaskById } from "../utils/taskQueries";
import { createTask, updateTask } from "../utils/taskMutations";

/**
 * POST endpoint that fetches tasks with optional filtering
 * Body: TaskFilters
 * Note: Always filters to environment = "prod"
 */
export async function getTasks(req: Request, res: Response) {
    try {
        const filters: TaskFilters = req.body;

        console.log("Received task fetch request with filters:", filters);

        // Use shared utility function to fetch tasks
        const tasks = await fetchTasks(filters);

        const response: TasksResponse = {
            tasks,
            nextPageToken: undefined, // TODO: Handle pagination if needed
        };

        return res.json(response);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks";
        return res.status(500).json({
            error: "Failed to fetch tasks",
            details: errorMessage,
        });
    }
}

/**
 * GET endpoint to fetch a specific task by ID
 */
export async function getTaskById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const task = await fetchTaskById(id);

        const response: TaskResponse = { task };
        return res.json(response);
    } catch (error) {
        console.error("Error fetching task:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch task";
        return res.status(500).json({
            error: "Failed to fetch task",
            details: errorMessage,
        });
    }
}

/**
 * POST endpoint to create a new task
 */
export async function createNewTask(req: Request, res: Response) {
    try {
        // Parse date strings to Date objects and normalize empty strings
        const normalizedBody = normalizeOptionalFields(req.body);
        const bodyWithDates = parseDateFields(normalizedBody);

        // Validate request body against schema
        const taskData: CreateTaskInput = CreateTaskSchema.parse(bodyWithDates);
        const task = await createTask(taskData);

        return res.status(201).json({ success: true, task });
    } catch (error) {
        console.error("Error creating task:", error);
        const statusCode = (error as { statusCode?: number })?.statusCode || 500;
        const message = (error as { parameters?: { message?: string } })?.parameters?.message;
        const errorMessage = message || (error instanceof Error ? error.message : "Failed to create task");
        return res.status(statusCode).json({
            error: "Failed to create task",
            details: errorMessage,
        });
    }
}

/**
 * PUT endpoint to update an existing task
 */
export async function updateExistingTask(req: Request, res: Response) {
    try {
        console.log("Update task request body:", JSON.stringify(req.body, null, 2));

        // Parse date strings to Date objects and normalize empty strings
        const normalizedBody = normalizeOptionalFields(req.body);
        const bodyWithDates = parseDateFields(normalizedBody);

        // Validate request body against schema
        const taskData: UpdateTaskInput = UpdateTaskSchema.parse(bodyWithDates);
        const task = await updateTask(taskData);

        return res.json({ success: true, task });
    } catch (error) {
        console.error("Error updating task:", error);
        const statusCode = (error as { statusCode?: number })?.statusCode || 500;
        const message = (error as { parameters?: { message?: string } })?.parameters?.message;
        const errorMessage = message || (error instanceof Error ? error.message : "Failed to update task");
        return res.status(statusCode).json({
            error: "Failed to update task",
            details: errorMessage,
        });
    }
}

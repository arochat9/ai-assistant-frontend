import { Request, Response } from "express";
import { Task as OsdkTask } from "@ai-assistant-third-party-app/sdk";
import * as Actions from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { Osdk } from "@osdk/client";
import {
    TaskFilters,
    CreateTaskInput,
    UpdateTaskInput,
    CreateTaskSchema,
    UpdateTaskSchema,
    TasksResponse,
    TaskResponse,
    TaskActionResponse,
    Environment,
} from "shared";
import { parseDateFields, normalizeOptionalFields } from "../utils/requestParser";
import { fetchTasks, fetchTaskById } from "../utils/taskQueries";

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

        // Convert Date objects to ISO strings for Foundry API
        const foundryData = {
            ...taskData,
            eventEndTime: taskData.eventEndTime?.toISOString(),
            eventStartTime: taskData.eventStartTime?.toISOString(),
            taskDueTime: taskData.taskDueTime?.toISOString(),
        };

        const result = await client(Actions.createTaskFromUi).applyAction(foundryData, {
            $returnEdits: true,
        });

        if (result.type !== "edits" || !result.addedObjects || result.addedObjects.length === 0) {
            return res.status(500).json({
                error: "Failed to create task",
                details: "Action did not return created object",
            });
        }

        // Fetch the created task using the primary key from the action response
        const createdTaskRef = result.addedObjects[0];
        const task = await fetchTaskById(createdTaskRef.primaryKey as string);

        return res.status(201).json({ success: true, task });
    } catch (error) {
        console.error("Error creating task:", error);
        const statusCode = (error as any)?.statusCode || 500;
        const message = (error as any)?.parameters?.message;
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
        // Parse date strings to Date objects and normalize empty strings
        const normalizedBody = normalizeOptionalFields(req.body);
        const bodyWithDates = parseDateFields(normalizedBody);

        // Validate request body against schema
        const taskData: UpdateTaskInput = UpdateTaskSchema.parse(bodyWithDates);

        // Convert Date objects to ISO strings for Foundry API
        const foundryData = {
            ...taskData,
            eventEndTime: taskData.eventEndTime?.toISOString(),
            eventStartTime: taskData.eventStartTime?.toISOString(),
            taskDueTime: taskData.taskDueTime?.toISOString(),
        };

        const result = await client(Actions.updateTaskFromUi).applyAction(foundryData, {
            $returnEdits: true,
        });

        if (result.type !== "edits" || !result.modifiedObjects || result.modifiedObjects.length === 0) {
            return res.status(500).json({
                error: "Failed to update task",
                details: "Action did not return modified object",
            });
        }

        // Fetch the updated task using the primary key from the action response
        const updatedTaskRef = result.modifiedObjects[0];
        const task = await fetchTaskById(updatedTaskRef.primaryKey as string);

        return res.json({ success: true, task });
    } catch (error) {
        console.error("Error updating task:", error);
        const statusCode = (error as any)?.statusCode || 500;
        const message = (error as any)?.parameters?.message;
        const errorMessage = message || (error instanceof Error ? error.message : "Failed to update task");
        return res.status(statusCode).json({
            error: "Failed to update task",
            details: errorMessage,
        });
    }
}

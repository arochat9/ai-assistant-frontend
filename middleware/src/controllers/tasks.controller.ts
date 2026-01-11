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
import { convertOsdkTaskToTask } from "../utils/taskConverter";
import { parseDateFields, normalizeOptionalFields } from "../utils/requestParser";

/**
 * POST endpoint that fetches tasks with optional filtering
 * Body: TaskFilters
 * Note: Always filters to environment = "prod"
 */
export async function getTasks(req: Request, res: Response) {
    try {
        const filters: TaskFilters = req.body;

        console.log("Received task fetch request with filters:", filters);

        const whereConditions: Array<Record<string, unknown>> = [{ environment: { $eq: Environment.PRODUCTION } }];

        if (filters.taskOrEvent) {
            whereConditions.push({ taskOrEvent: { $eq: filters.taskOrEvent } });
        }

        if (filters.status) {
            whereConditions.push({ status: { $eq: filters.status } });
        }

        if (filters.subType) {
            whereConditions.push({ subType: { $eq: filters.subType } });
        }

        if (filters.keyword) {
            whereConditions.push({
                $or: [
                    { taskName: { $containsAllTerms: filters.keyword } },
                    { taskContext: { $containsAllTerms: filters.keyword } },
                ],
            });
        }

        if (filters.updatedAfter) {
            whereConditions.push({ updatedAt: { $gte: filters.updatedAfter } });
        }

        if (filters.eventStartAfter) {
            whereConditions.push({ eventStartTime: { $gte: filters.eventStartAfter } });
        }

        if (filters.eventStartBefore) {
            whereConditions.push({ eventStartTime: { $lte: filters.eventStartBefore } });
        }

        if (filters.eventEndAfter) {
            whereConditions.push({ eventEndTime: { $gte: filters.eventEndAfter } });
        }

        if (filters.eventEndBefore) {
            whereConditions.push({ eventEndTime: { $lte: filters.eventEndBefore } });
        }

        // Fetch tasks from Foundry (always filtered to prod environment)
        const tasksQuery = client(OsdkTask).where({ $and: whereConditions });

        const tasksPage = await tasksQuery.fetchPage({ $pageSize: 100 });
        const osdkTasks: Osdk.Instance<OsdkTask>[] = tasksPage.data;

        // Convert OSDK tasks to custom Task objects
        const tasks = osdkTasks.map(convertOsdkTaskToTask);

        const response: TasksResponse = {
            tasks,
            nextPageToken: tasksPage.nextPageToken,
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

        const osdkTask = await client(OsdkTask).fetchOne(id);

        if (!osdkTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Convert OSDK task to custom Task object
        const task = convertOsdkTaskToTask(osdkTask);

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
        const osdkTask = await client(OsdkTask).fetchOne(createdTaskRef.primaryKey as string);

        if (!osdkTask) {
            return res.status(500).json({
                error: "Failed to fetch created task",
                details: "Task was created but could not be retrieved",
            });
        }

        const task = convertOsdkTaskToTask(osdkTask);
        return res.status(201).json({ success: true, task });
    } catch (error) {
        console.error("Error creating task:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create task";
        return res.status(500).json({
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
        const osdkTask = await client(OsdkTask).fetchOne(updatedTaskRef.primaryKey as string);

        if (!osdkTask) {
            return res.status(500).json({
                error: "Failed to fetch updated task",
                details: "Task was updated but could not be retrieved",
            });
        }

        const task = convertOsdkTaskToTask(osdkTask);
        return res.json({ success: true, task });
    } catch (error) {
        console.error("Error updating task:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update task";
        return res.status(500).json({
            error: "Failed to update task",
            details: errorMessage,
        });
    }
}

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
} from "shared";
import { convertOsdkTaskToTask } from "../utils/taskConverter";

/**
 * POST endpoint that fetches tasks with optional filtering
 * Body: TaskFilters
 * Note: Always filters to environment = "prod"
 */
export async function getTasks(req: Request, res: Response) {
    try {
        const filters: TaskFilters = req.body;

        const whereConditions: Array<Record<string, unknown>> = [
            { environment: { $eq: "prod" } },
            { taskOrEvent: { $eq: "Task" } },
        ];

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
            whereConditions.push({ updatedAt: { $gte: filters.updatedAfter.toISOString() } });
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
        // Validate request body against schema
        const taskData: CreateTaskInput = CreateTaskSchema.parse(req.body);

        // Convert Date objects to ISO strings for Foundry API
        const foundryData = {
            ...taskData,
            task_due_time: taskData.task_due_time?.toISOString(),
            event_start_time: taskData.event_start_time?.toISOString(),
            event_end_time: taskData.event_end_time?.toISOString(),
        };

        await client(Actions.createTask).applyAction(foundryData);

        // Query for the most recently created task matching the task_name
        // This is a workaround since the action doesn't return the created object
        const tasksQuery = client(OsdkTask).where({
            $and: [{ taskName: { $eq: taskData.task_name } }, { environment: { $eq: taskData.environment } }],
        });

        const tasksPage = await tasksQuery.fetchPage({ $pageSize: 1, $orderBy: { createdAt: "desc" } });
        const osdkTask = tasksPage.data[0];

        if (!osdkTask) {
            return res.status(500).json({
                error: "Failed to create task",
                details: "Could not fetch created task",
            });
        }

        // Convert OSDK task to custom Task object
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
        // Validate request body against schema
        const taskData: UpdateTaskInput = UpdateTaskSchema.parse(req.body);

        // Convert Date objects to ISO strings for Foundry API
        const foundryData = {
            ...taskData,
            task_due_time: taskData.task_due_time?.toISOString(),
            event_start_time: taskData.event_start_time?.toISOString(),
            event_end_time: taskData.event_end_time?.toISOString(),
        };

        await client(Actions.updateTask).applyAction(foundryData);

        // Fetch the updated task
        const osdkTask = await client(OsdkTask).fetchOne(taskData.taskId);

        if (!osdkTask) {
            return res.status(500).json({
                error: "Failed to update task",
                details: "Could not fetch updated task",
            });
        }

        // Convert OSDK task to custom Task object
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

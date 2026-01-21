import * as Actions from "@ai-assistant-third-party-app/sdk";
import { client } from "../config/foundry";
import { CreateTaskInput, UpdateTaskInput } from "shared";
import { fetchTaskById } from "./taskQueries";
import type { Task } from "shared";

/** Convert Date objects to ISO strings for Foundry API */
function toFoundryDates<T extends { eventEndTime?: Date; eventStartTime?: Date; taskDueTime?: Date }>(
    data: T,
): Omit<T, "eventEndTime" | "eventStartTime" | "taskDueTime"> & {
    eventEndTime?: string;
    eventStartTime?: string;
    taskDueTime?: string;
} {
    const { eventEndTime, eventStartTime, taskDueTime, ...rest } = data;
    return {
        ...rest,
        eventEndTime: eventEndTime?.toISOString(),
        eventStartTime: eventStartTime?.toISOString(),
        taskDueTime: taskDueTime?.toISOString(),
    };
}

/**
 * Create a new task in Foundry
 * Used by both tasks controller and agent
 */
export async function createTask(taskData: CreateTaskInput): Promise<Task> {
    const foundryData = toFoundryDates(taskData);

    const result = await client(Actions.createTaskFromUi).applyAction(foundryData, {
        $returnEdits: true,
    });

    if (result.type !== "edits" || !result.addedObjects?.length) {
        throw new Error("Failed to create task: Action did not return created object");
    }

    return fetchTaskById(result.addedObjects[0].primaryKey as string);
}

/**
 * Update an existing task in Foundry
 * Used by both tasks controller and agent
 */
export async function updateTask(taskData: UpdateTaskInput): Promise<Task> {
    const foundryData = toFoundryDates(taskData);

    const result = await client(Actions.updateTaskFromUi).applyAction(foundryData, {
        $returnEdits: true,
    });

    if (result.type !== "edits" || !result.modifiedObjects?.length) {
        throw new Error("Failed to update task: Action did not return modified object");
    }

    return fetchTaskById(result.modifiedObjects[0].primaryKey as string);
}

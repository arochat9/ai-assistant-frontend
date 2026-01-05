/**
 * Parses date string fields from request body into Date objects
 * @param body Request body with potential date string fields
 * @returns Body with date strings converted to Date objects
 */
export function parseDateFields<T extends Record<string, any>>(body: T): T {
    return {
        ...body,
        taskDueTime: body.taskDueTime ? new Date(body.taskDueTime) : undefined,
        eventStartTime: body.eventStartTime ? new Date(body.eventStartTime) : undefined,
        eventEndTime: body.eventEndTime ? new Date(body.eventEndTime) : undefined,
    };
}

/**
 * Converts empty strings to undefined for optional fields
 * @param body Request body with potential empty string fields
 * @returns Body with empty strings converted to undefined
 */
export function normalizeOptionalFields<T extends Record<string, any>>(body: T): T {
    return {
        ...body,
        plannedFor: body.plannedFor === "" ? undefined : body.plannedFor,
        source: body.source === "" ? undefined : body.source,
        userNotes: body.userNotes === "" ? undefined : body.userNotes,
    };
}

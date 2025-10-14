import { Request, Response } from "express";
import { FormData, LoggedWorkout } from "../../../src/domain/types";

// Allow overriding key names via env to match your AWS table
const PK_NAME = process.env.DDB_PK_NAME || "userId";
const SK_NAME = process.env.DDB_SK_NAME || "entityKey";
const WORKOUT_PREFIX = process.env.DDB_WORKOUT_PREFIX || "WORKOUT#";

export function getPrimaryKeyNames(): { pkName: string; skName: string } {
    return { pkName: PK_NAME, skName: SK_NAME };
}

export function getUserId(req: Request): string | null {
    // Prefer user from Cognito auth middleware
    const authUserId = (req as unknown as { user?: { id?: string } }).user?.id;
    if (authUserId) return authUserId;
    // Fallback for legacy header during migration/testing
    const hdr = req.headers['user-id'];
    const headerUserId = typeof hdr === 'string' ? hdr : Array.isArray(hdr) ? hdr[0] : undefined;
    return headerUserId ?? null;
}

export function requireUserId(req: Request, res: Response): string | void {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ error: "Unauthorized", message: "User ID is required" });
        return;
    }
    return userId;
}

export function validateRequired(formData: Partial<FormData>, fields: Array<keyof FormData>): string[] {
    const missing: string[] = [];
    for (const field of fields) {
        const value = formData[field];
        const isMissing = value === undefined || value === null || value === "";
        if (isMissing) missing.push(String(field));
    }
    return missing;
}

export function calculateDuration(hours?: number, minutes?: number, seconds?: number): number {
    return (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60) + Number(seconds || 0);
}

export function makeTimestamp(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
}

export function generateWorkoutName(type: string, time: string, provided?: string): string {
    if (provided && provided.trim().length > 0) return provided;
    const hour = parseInt(time.split(':')[0], 10);
    let timeOfDay = "Night";
    if (hour >= 20) {
        timeOfDay = "Night";
    } else if (hour >= 18) {
        timeOfDay = "Evening";
    } else if (hour >= 14) {
        timeOfDay = "Afternoon";
    } else if (hour >= 11) {
        timeOfDay = "Lunch";
    } else if (hour >= 5) {
        timeOfDay = "Morning";
    }
    return `${timeOfDay} ${type}`;
}

export function toLoggedWorkout(formData: FormData, workoutId: string): LoggedWorkout {
    const duration = calculateDuration(formData.hours, formData.minutes, formData.seconds);
    const timestamp = makeTimestamp(formData.date, formData.time);
    const name = generateWorkoutName(formData.type, formData.time, formData.name);
    return {
        id: workoutId,
        name,
        date: formData.date,
        time: formData.time,
        timestamp,
        duration,
        distance: formData.distance,
        unit: formData.unit,
        type: formData.type,
        effortLevel: formData.effortLevel,
        notes: formData.notes,
    };
}

export function buildWorkoutKeys(userId: string, workoutId: string): Record<string, string> {
    return {
        [PK_NAME]: `${userId}`,
        [SK_NAME]: `${WORKOUT_PREFIX}${workoutId}`,
    };
}

export function toDynamoItem(workout: LoggedWorkout, userId: string, ts: Date, nowISO?: string): Record<string, unknown> {
    const keys = buildWorkoutKeys(userId, workout.id);
    const now = nowISO || new Date().toISOString();
    return {
        ...keys,
        ...workout,
        timestamp: ts.toISOString(),
        userId,
        createdAt: now,
        updatedAt: now,
    };
}

export function isConditionalCheckFailed(err: unknown): boolean {
    return !!(err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ConditionalCheckFailedException');
}

export function sendValidationError(res: Response, message: string): void {
    res.status(400).json({ error: "Bad Request", message });
}

export function sendServerError(res: Response, message: string): void {
    res.status(500).json({ error: "Internal Server Error", message });
}

export function normalizeTimestamp(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') return new Date(value);
    // Fallback to now to avoid crashes; callers should validate
    return new Date();
}

export function fromDynamoItemToWorkout(item: Record<string, unknown>): LoggedWorkout {
    return {
        id: item.id as string,
        name: item.name as string,
        date: item.date as string,
        time: item.time as string,
        timestamp: normalizeTimestamp((item as { timestamp?: unknown }).timestamp),
        duration: item.duration as number,
        distance: item.distance as number | undefined,
        unit: item.unit as string,
        type: item.type as string,
        effortLevel: item.effortLevel as string,
        notes: item.notes as string,
    };
}

export function durationToHMS(totalSeconds: number | undefined): { hours: number; minutes: number; seconds: number } {
    const secs = Number(totalSeconds || 0);
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return { hours, minutes, seconds };
}

export function workoutItemToFormData(item: Record<string, unknown>): FormData {
    const workout = fromDynamoItemToWorkout(item);
    const hms = durationToHMS(workout.duration);
    return {
        name: workout.name,
        type: workout.type,
        date: workout.date,
        time: workout.time,
        timestamp: workout.timestamp,
        hours: hms.hours,
        minutes: hms.minutes,
        seconds: hms.seconds,
        duration: workout.duration,
        distance: workout.distance,
        unit: workout.unit,
        effortLevel: workout.effortLevel,
        notes: workout.notes,
    };
}

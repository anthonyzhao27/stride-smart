import { Request, Response } from "express";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { FormData, LoggedWorkout } from "../../../src/domain/types";
import { requireUserId, validateRequired, toLoggedWorkout, makeTimestamp, workoutItemToFormData, buildWorkoutKeys } from "./utils";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function updateWorkout(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "Bad Request", message: "Missing workout id" });
        return;
    }

    const formData = req.body as Partial<FormData>;
    const minimalMissing = validateRequired(formData as FormData, ["date", "time", "type"]);
    if (minimalMissing.length > 0) {
        res.status(400).json({ error: "Bad Request", message: `Missing required fields: ${minimalMissing.join(', ')}` });
        return;
    }

    try {
        // Ensure the workout exists first
        const existing = await dynamoClient.send(new GetCommand({
            TableName: tableName,
            Key: buildWorkoutKeys(userId, id),
        }));
        if (!existing.Item) {
            res.status(404).json({ error: "Not Found", message: "Workout not found" });
            return;
        }

        // Rebuild the LoggedWorkout from provided data merged with existing
        const baseForm = workoutItemToFormData(existing.Item as Record<string, unknown>);
        const merged: FormData = {
            name: formData.name ?? baseForm.name,
            type: formData.type ?? baseForm.type,
            date: formData.date ?? baseForm.date,
            time: formData.time ?? baseForm.time,
            timestamp: baseForm.timestamp,
            hours: formData.hours ?? baseForm.hours,
            minutes: formData.minutes ?? baseForm.minutes,
            seconds: formData.seconds ?? baseForm.seconds,
            duration: formData.duration ?? baseForm.duration,
            distance: formData.distance ?? baseForm.distance,
            unit: formData.unit ?? baseForm.unit,
            effortLevel: formData.effortLevel ?? baseForm.effortLevel,
            notes: formData.notes ?? baseForm.notes,
        };
        const updatedWorkout: LoggedWorkout = toLoggedWorkout(merged, id);
        const ts = makeTimestamp(updatedWorkout.date, updatedWorkout.time);

        await dynamoClient.send(new UpdateCommand({
            TableName: tableName,
            Key: buildWorkoutKeys(userId, id),
            UpdateExpression: "SET #name = :name, #date = :date, #time = :time, #timestamp = :timestamp, #duration = :duration, #distance = :distance, #unit = :unit, #type = :type, #effortLevel = :effortLevel, #notes = :notes, #updatedAt = :updatedAt",
            ExpressionAttributeNames: {
                "#name": "name",
                "#date": "date",
                "#time": "time",
                "#timestamp": "timestamp",
                "#duration": "duration",
                "#distance": "distance",
                "#unit": "unit",
                "#type": "type",
                "#effortLevel": "effortLevel",
                "#notes": "notes",
                "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
                ":name": updatedWorkout.name,
                ":date": updatedWorkout.date,
                ":time": updatedWorkout.time,
                ":timestamp": ts.toISOString(),
                ":duration": updatedWorkout.duration,
                ":distance": updatedWorkout.distance ?? null,
                ":unit": updatedWorkout.unit,
                ":type": updatedWorkout.type,
                ":effortLevel": updatedWorkout.effortLevel,
                ":notes": updatedWorkout.notes,
                ":updatedAt": new Date().toISOString(),
            },
        }));

        res.status(200).json({ message: "Workout updated", workout: updatedWorkout });
    } catch (error) {
        console.error("Error updating workout:", error);
        res.status(500).json({ error: "Internal Server Error", message: "Failed to update workout" });
    }
}



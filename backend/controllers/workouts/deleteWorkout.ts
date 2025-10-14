import { Request, Response } from "express";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId, buildWorkoutKeys } from "./utils";
import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export async function deleteWorkout(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "Bad Request", message: "Missing workout id" });
        return;
    }

    try {
        // Ensure it exists
        const existing = await dynamoClient.send(new GetCommand({
            TableName: tableName,
            Key: buildWorkoutKeys(userId, id),
        }));
        if (!existing.Item) {
            res.status(404).json({ error: "Not Found", message: "Workout not found" });
            return;
        }

        await dynamoClient.send(new DeleteCommand({
            TableName: tableName,
            Key: buildWorkoutKeys(userId, id),
        }));

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting workout:", error);
        res.status(500).json({ error: "Internal Server Error", message: "Failed to delete workout" });
    }
}



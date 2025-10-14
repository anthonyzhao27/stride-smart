import { Request, Response } from "express";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId, fromDynamoItemToWorkout, buildWorkoutKeys } from "./utils";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function getWorkoutById(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: "Bad Request", message: "Missing workout id" });
        return;
    }

    try {
        const key = buildWorkoutKeys(userId, id);
        
        console.log('🔍 Getting workout by ID with key:', key);
        
        const result = await dynamoClient.send(new GetCommand({
            TableName: tableName,
            Key: key,
        }));

        if (!result.Item) {
            res.status(404).json({ error: "Not Found", message: "Workout not found" });
            return;
        }

        const workout = fromDynamoItemToWorkout(result.Item);
        res.status(200).json({ workout });
    } catch (error) {
        console.error("Error fetching workout:", error);
        res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch workout" });
    }
}



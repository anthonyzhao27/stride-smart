import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { requireUserId, fromDynamoItemToWorkout } from "./utils";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { Request, Response } from "express";


export async function getWorkouts(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    console.log("DEBUG getWorkouts", {
        userId,
        tableName,
        region: (dynamoClient.config).region,
    });
    try {
        const result = await dynamoClient.send(new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "userId = :uid AND begins_with(entityKey, :w)",
            ExpressionAttributeValues: {
                ":uid": userId,
                ":w": "WORKOUT#",
            },
            ConsistentRead: true, // avoids stale reads after writes
        }));
        const workouts = (result.Items ?? []).map((item) => fromDynamoItemToWorkout(item as Record<string, unknown>));
        console.log("DEBUG workouts:", workouts);
        res.status(200).json({ ok: true, workouts });
    } catch (err) {
        console.error("getWorkouts error:", err); // <-- log the real error
        res.status(500).json({ ok: false, error: "Failed to fetch workouts" });
    }
}

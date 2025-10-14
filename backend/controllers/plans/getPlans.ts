import { Request, Response } from "express";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";

// const PLAN_PREFIX = process.env.DDB_PLAN_PREFIX || "PLAN#";

export async function getPlans(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const limit = 6;

    try {
        const result = await dynamoClient.send(new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :workoutPref)",
          ExpressionAttributeNames: { "#pk": "userId", "#sk": "entityKey" },
          ExpressionAttributeValues: { ":pk": userId, ":workoutPref": "WORKOUT#" },
          ScanIndexForward: false, // newest first if SK has ISO8601 timestamp
          Limit: limit,
          ProjectionExpression: "workoutId, summary, metrics, createdAt, updatedAt",
        }));
    
        res.status(200).json({ ok: true, items: result.Items ?? [] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "Failed to fetch workouts" });
    }
}

export default getPlans;



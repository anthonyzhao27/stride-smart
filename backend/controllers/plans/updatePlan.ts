import { Request, Response } from "express";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";

const PLAN_PREFIX = process.env.DDB_PLAN_PREFIX || "PLAN#";

export async function updatePlan(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const planId = req.params.id;
    if (!planId) {
        res.status(400).json({ ok: false, error: "Missing plan id" });
        return;
    }

    const planPatch = req.body || {};

    try {
        await dynamoClient.send(new UpdateCommand({
            TableName: tableName,
            Key: { userId, entityKey: `${PLAN_PREFIX}${planId}` },
            UpdateExpression: "SET #plan = :plan, updatedAt = :now",
            ExpressionAttributeNames: { "#plan": "plan" },
            ExpressionAttributeValues: { ":plan": planPatch, ":now": new Date().toISOString() },
        }));

        res.status(200).json({ ok: true, planId, plan: planPatch });
    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ ok: false, error: "Failed to update plan" });
    }
}

export default updatePlan;



import { Request, Response } from "express";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";

const PLAN_PREFIX = process.env.DDB_PLAN_PREFIX || "PLAN#";

export async function getPlanById(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const planId = req.params.id;
    if (!planId) {
        res.status(400).json({ ok: false, error: "Missing plan id" });
        return;
    }

    try {
        const result = await dynamoClient.send(new GetCommand({
            TableName: tableName,
            Key: { userId, entityKey: `${PLAN_PREFIX}${planId}` },
        }));

        if (!result.Item) {
            res.status(404).json({ ok: false, error: "Plan not found" });
            return;
        }

        res.status(200).json({ ok: true, planId, plan: (result.Item as any).plan });
    } catch (error) {
        console.error("Error fetching plan:", error);
        res.status(500).json({ ok: false, error: "Failed to fetch plan" });
    }
}

export default getPlanById;



import { Request, Response } from "express";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";

const PLAN_PREFIX = process.env.DDB_PLAN_PREFIX || "PLAN#";

export async function deletePlan(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const planId = req.params.id;
    if (!planId) {
        res.status(400).json({ ok: false, error: "Missing plan id" });
        return;
    }

    try {
        await dynamoClient.send(new DeleteCommand({
            TableName: tableName,
            Key: { userId, entityKey: `${PLAN_PREFIX}${planId}` },
        }));

        res.status(200).json({ ok: true, planId });
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ ok: false, error: "Failed to delete plan" });
    }
}

export default deletePlan;



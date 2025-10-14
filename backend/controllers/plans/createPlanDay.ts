import { Request, Response } from "express";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId, getPrimaryKeyNames } from "../workouts/utils";
import type { TrainingWorkout } from "../../../src/domain/types";

export async function createPlanDay(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    try {
        const planId = (req.body && (req.body as { id?: string }).id) || uuidv4();
        const planPayload = req.body as TrainingWorkout;

        const planDate = planPayload.date.toISOString();

        const { pkName, skName } = getPrimaryKeyNames();
        const now = new Date().toISOString();
        const item = {
            [pkName]: userId,
            [skName]: `PLAN#DT#${planDate}#WORKOUT#${planId}`,
            userId,
            entityKey: `PLAN#DT#${planDate}#WORKOUT#${planId}`,
            planId,
            plan: planPayload,
            createdAt: now,
            updatedAt: now,
        };

        await dynamoClient.send(new PutCommand({
            TableName: tableName,
            Item: item,
        }));

        res.status(201).json({ ok: true, planId, plan: planPayload });
    } catch (error) {
        console.error("Error creating plan:", error);
        res.status(500).json({ ok: false, error: "Failed to create plan" });
    }
}



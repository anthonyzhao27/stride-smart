import { Request, Response } from "express";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";
import { User } from "../../../src/domain/types";
import { ONBOARDING_ENTITY_KEY } from "./getOnboardingProfile";

function getWeeksBetweenDates(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diff = end.getTime() - start.getTime();
    const weeks = Math.ceil(diff / msPerWeek);
    return Math.max(weeks, 1);
}

export async function upsertOnboardingProfile(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const body = req.body as Partial<User> & { doubleThresholdDays?: number };

    const requiredFields: Array<keyof User> = [
        "experience",
        "trainingDays",
        "currentMileage",
        "currentRaceTime",
        "currentRaceDistance",
        "goalMileage",
        "goalRaceTime",
        "goalRaceDistance",
        "goalRaceDate",
        "planStartDate",
    ];

    const missing = requiredFields.filter((f) => (body as Record<string, unknown>)[f] == null);
    if (missing.length > 0) {
        res.status(400).json({ ok: false, error: `Missing required fields: ${missing.join(", ")}` });
        return;
    }

    const numWeeks = body.numWeeks && body.numWeeks > 0
        ? body.numWeeks
        : getWeeksBetweenDates(String(body.planStartDate), String(body.goalRaceDate));

    const numDaysDoubleThreshold =
        body.numDaysDoubleThreshold != null
            ? body.numDaysDoubleThreshold
            : (body as { doubleThresholdDays?: number }).doubleThresholdDays;

    const profile: User = {
        experience: String(body.experience),
        trainingDays: Array.isArray(body.trainingDays) ? (body.trainingDays as string[]) : [],
        currentMileage: Number(body.currentMileage || 0),
        currentRaceTime: String(body.currentRaceTime),
        currentRaceDistance: body.currentRaceDistance!,
        goalMileage: Number(body.goalMileage || 0),
        goalRaceTime: String(body.goalRaceTime),
        goalRaceDistance: body.goalRaceDistance!,
        goalRaceDate: String(body.goalRaceDate),
        planStartDate: String(body.planStartDate),
        numWeeks,
        ...(numDaysDoubleThreshold != null ? { numDaysDoubleThreshold: Number(numDaysDoubleThreshold) } : {}),
    };

    const now = new Date().toISOString();
    const pkName = process.env.DDB_PK_NAME || "userId";
    const skName = process.env.DDB_SK_NAME || "entityKey";

    const item = {
        [pkName]: `${userId}`,
        [skName]: ONBOARDING_ENTITY_KEY,
        profile,
        updatedAt: now,
        createdAt: now,
    } as Record<string, unknown>;

    try {
        await dynamoClient.send(new PutCommand({
            TableName: tableName,
            Item: item,
        }));

        res.status(200).json({ ok: true, profile });
    } catch (error) {
        console.error("Error saving onboarding profile:", error);
        res.status(500).json({ ok: false, error: "Failed to save onboarding profile" });
    }
}



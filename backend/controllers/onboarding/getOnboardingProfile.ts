import { Request, Response } from "express";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import { requireUserId } from "../workouts/utils";
import { User } from "../../../src/domain/types";

export const ONBOARDING_ENTITY_KEY = "ONBOARDING#PROFILE";

export async function getOnboardingProfile(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const result = await dynamoClient.send(new GetCommand({
      TableName: tableName,
      Key: { userId, entityKey: ONBOARDING_ENTITY_KEY },
      ConsistentRead: true,            // avoids eventual-consistency surprises right after writes
      // ProjectionExpression: "#p",    // optional: fetch only what you need
      // ExpressionAttributeNames: { "#p": "profile" }
    }));

    if (!result.Item) {
      res.status(404).json({ ok: false, message: "Onboarding profile not found" });
      return;
    }

    const profile = result.Item.profile as User | undefined;
    if (!profile) {
      res.status(500).json({ ok: false, error: "Item missing 'profile' attribute" });
      return;
    }

    res.status(200).json({ ok: true, profile });
  } catch (err) {
    console.error("Error fetching onboarding profile:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch onboarding profile" });
  }
}
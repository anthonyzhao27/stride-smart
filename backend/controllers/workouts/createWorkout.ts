import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Router, Response, Request } from "express";
import { LoggedWorkout, FormData } from "@/domain/types";
import { dynamoClient, tableName } from "../../db/dynamoClient";
import {
  requireUserId,
  validateRequired,
  toLoggedWorkout,
  toDynamoItem,
  isConditionalCheckFailed,
  sendValidationError,
  makeTimestamp,
  getPrimaryKeyNames,
} from "./utils";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const router = Router();

export const createWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Ensure req.body is an object and cast to FormData
    const formData = req.body as FormData;
    const missing = validateRequired(formData, ["type", "date", "time"]);
    if (missing.length > 0) {
      sendValidationError(res, `Missing required fields: ${missing.join(", ")}`);
      return;
    }

    const workoutId = uuidv4();
    const loggedWorkout: LoggedWorkout = toLoggedWorkout(formData, workoutId);
    const timestamp = makeTimestamp(loggedWorkout.date, loggedWorkout.time);
    const dynamoItem = toDynamoItem(loggedWorkout, userId, timestamp);

    const { pkName, skName } = getPrimaryKeyNames();
    
    console.log('📝 Creating workout with keys:', {
      pkName,
      skName,
      pkValue: dynamoItem[pkName],
      skValue: dynamoItem[skName],
      fullItem: dynamoItem
    });
    
    await dynamoClient.send(
      new PutCommand({
        TableName: tableName,
        Item: dynamoItem,
        ConditionExpression: `attribute_not_exists(${pkName}) AND attribute_not_exists(${skName})`,
      })
    );

    res.status(201).json({
      message: "Workout created successfully",
      workout: loggedWorkout,
    });
  } catch (error: unknown) {
    console.error("Error creating workout:", error);

    if (isConditionalCheckFailed(error)) {
      res.status(409).json({ error: "Conflict", message: "Workout with this ID already exists" });
      return;
    }

    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      res.status(400).json({
        error: "Validation Error",
        message: (error as Error).message || "Validation failed",
      });
      return;
    }

    const err = error as { name?: string; message?: string; code?: string };
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create workout",
      details: { name: err?.name, code: err?.code, message: err?.message }
    });
  }
};

export default router;
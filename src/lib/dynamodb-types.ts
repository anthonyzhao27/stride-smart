// DynamoDB table item types
export interface DynamoDBWorkout {
  id: string;
  userId: string;
  date: string; // ISO date string
  type: string;
  distance?: number;
  duration?: number; // in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamoDBWorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  workouts: any[];
  createdAt: string;
  updatedAt: string;
}

// Query parameters
export interface QueryParams {
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  IndexName?: string;
  Limit?: number;
  ExclusiveStartKey?: Record<string, any>;
}

// Update parameters
export interface UpdateParams {
  UpdateExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues: Record<string, any>;
}

// Response types
export interface DynamoDBResponse<T> {
  Items?: T[];
  Count?: number;
  ScannedCount?: number;
  LastEvaluatedKey?: Record<string, any>;
}

export interface DynamoDBError {
  name: string;
  message: string;
  statusCode?: number;
}

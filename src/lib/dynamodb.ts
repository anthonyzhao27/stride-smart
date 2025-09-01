import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
  // Use local DynamoDB for development, production AWS for deployment
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

// Create document client for easier operations
export const docClient = DynamoDBDocumentClient.from(client);

// Table names
export const TABLES = {
  WORKOUTS: 'workouts',
  USERS: 'users',
  WORKOUT_PLANS: 'workout_plans',
} as const;

// Common DynamoDB operations
export const dynamoOperations = {
  // Put item
  async putItem(tableName: string, item: Record<string, unknown>) {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return docClient.send(command);
  },

  // Get item
  async getItem(tableName: string, key: Record<string, unknown>) {
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    return docClient.send(command);
  },

  // Query items
  async queryItems(tableName: string, params: Record<string, unknown>) {
    const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new QueryCommand({
      TableName: tableName,
      ...params,
    });
    return docClient.send(command);
  },

  // Scan items
  async scanItems(tableName: string, params: Record<string, unknown> = {}) {
    const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new ScanCommand({
      TableName: tableName,
      ...params,
    });
    return docClient.send(command);
  },

  // Update item
  async updateItem(tableName: string, key: Record<string, unknown>, updateExpression: string, expressionAttributeValues: Record<string, unknown>) {
    const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });
    return docClient.send(command);
  },

  // Delete item
  async deleteItem(tableName: string, key: Record<string, unknown>) {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return docClient.send(command);
  },
};

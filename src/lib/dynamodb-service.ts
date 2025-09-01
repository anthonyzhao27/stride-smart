import { dynamoOperations, TABLES } from './dynamodb';
import { LoggedWorkout, User } from './types';

// DynamoDB Service Layer - Firebase to DynamoDB Migration
export class DynamoDBService {
  
  // ===== WORKOUTS =====
  
  // Create a new workout
  static async createWorkout(uid: string, workoutData: Omit<LoggedWorkout, 'id'>): Promise<LoggedWorkout> {
    const workout: LoggedWorkout = {
      ...workoutData,
      id: `${uid}-${Date.now()}`,
    };

    await dynamoOperations.putItem(TABLES.WORKOUTS, {
      id: workout.id,
      userId: uid,
      name: workout.name,
      date: workout.date,
      time: workout.time,
      timestamp: workout.timestamp.toISOString(),
      duration: workout.duration,
      distance: workout.distance,
      unit: workout.unit,
      type: workout.type,
      effortLevel: workout.effortLevel,
      notes: workout.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return workout;
  }

  // Get workouts for a specific month (replaces fetchWorkoutsForMonth)
  static async fetchWorkoutsForMonth(start: Date, uid: string): Promise<Record<string, LoggedWorkout[]>> {
    const end = new Date(start);
    end.setDate(start.getDate() + 42);

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    // Query workouts within date range for the user
    const result = await dynamoOperations.queryItems(TABLES.WORKOUTS, {
      IndexName: 'date-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':userId': uid,
        ':startDate': startDate,
        ':endDate': endDate,
      },
    });

    const workouts = result.Items || [];
    const resultMap: Record<string, LoggedWorkout[]> = {};

    workouts.forEach((item: Record<string, unknown>) => {
      const workout: LoggedWorkout = {
        id: item.id as string,
        name: item.name as string,
        timestamp: new Date(item.timestamp as string),
        date: item.date as string,
        time: item.time as string,
        duration: item.duration as number,
        distance: item.distance as number | undefined,
        unit: item.unit as string,
        type: item.type as string,
        effortLevel: item.effortLevel as string,
        notes: item.notes as string,
      };

      if (!resultMap[workout.date]) {
        resultMap[workout.date] = [];
      }
      resultMap[workout.date].push(workout);
    });

    return resultMap;
  }

  // Get all workouts for a user (replaces TrainingLog functionality)
  static async getUserWorkouts(uid: string): Promise<LoggedWorkout[]> {
    const result = await dynamoOperations.queryItems(TABLES.WORKOUTS, {
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': uid,
      },
    });

    const workouts = result.Items || [];
    return workouts.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      timestamp: new Date(item.timestamp as string),
      date: item.date as string,
      time: item.time as string,
      duration: item.duration as number,
      distance: item.distance as number | undefined,
      unit: item.unit as string,
      type: item.type as string,
      effortLevel: item.effortLevel as string,
      notes: item.notes as string,
    }));
  }

  // Update a workout
  static async updateWorkout(uid: string, workoutId: string, updates: Partial<LoggedWorkout>): Promise<void> {
    const updateExpression: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    // Build dynamic update expression
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
        expressionAttributeNames[`#${key}`] = key;
      }
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    if (updateExpression.length === 0) {
      throw new Error('No fields to update');
    }

    await dynamoOperations.updateItem(
      TABLES.WORKOUTS,
      { id: workoutId, userId: uid },
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeValues
    );
  }

  // Delete a workout
  static async deleteWorkout(uid: string, workoutId: string): Promise<void> {
    await dynamoOperations.deleteItem(TABLES.WORKOUTS, {
      id: workoutId,
      userId: uid,
    });
  }

  // ===== USERS =====
  
  // Create or update user profile
  static async setUserProfile(uid: string, userData: User & { email?: string; name?: string }): Promise<void> {
    await dynamoOperations.putItem(TABLES.USERS, {
      id: uid,
      email: userData.email || '',
      name: userData.name || '',
      experience: userData.experience,
      numDaysDoubleThreshold: userData.numDaysDoubleThreshold,
      trainingDays: userData.trainingDays,
      currentMileage: userData.currentMileage,
      currentRaceTime: userData.currentRaceTime,
      currentRaceDistance: userData.currentRaceDistance,
      goalMileage: userData.goalMileage,
      goalRaceTime: userData.goalRaceTime,
      goalRaceDistance: userData.goalRaceDistance,
      goalRaceDate: userData.goalRaceDate,
      planStartDate: userData.planStartDate,
      numWeeks: userData.numWeeks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Get user profile
  static async getUserProfile(uid: string): Promise<User | null> {
    const result = await dynamoOperations.getItem(TABLES.USERS, { id: uid });
    
    if (!result.Item) {
      return null;
    }

    const item = result.Item;
    return {
      experience: item.experience,
      numDaysDoubleThreshold: item.numDaysDoubleThreshold,
      trainingDays: item.trainingDays,
      currentMileage: item.currentMileage,
      currentRaceTime: item.currentRaceTime,
      currentRaceDistance: item.currentRaceDistance,
      goalMileage: item.goalMileage,
      goalRaceTime: item.goalRaceTime,
      goalRaceDistance: item.goalRaceDistance,
      goalRaceDate: item.goalRaceDate,
      planStartDate: item.planStartDate,
      numWeeks: item.numWeeks,
    };
  }

  // ===== WORKOUT PLANS =====
  
  // Save workout plan
  static async saveWorkoutPlan(uid: string, plan: Record<string, unknown>): Promise<void> {
    await dynamoOperations.putItem(TABLES.WORKOUT_PLANS, {
      id: `${uid}-${Date.now()}`,
      userId: uid,
      name: plan.name || 'Untitled Plan',
      description: plan.description,
      workouts: plan.workouts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Get user's workout plans
  static async getUserWorkoutPlans(uid: string): Promise<Record<string, unknown>[]> {
    const result = await dynamoOperations.queryItems(TABLES.WORKOUT_PLANS, {
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': uid,
      },
    });

    return result.Items || [];
  }

  // ===== UTILITY METHODS =====
  
  // Check if DynamoDB is connected
  static async testConnection(): Promise<boolean> {
    try {
      await dynamoOperations.scanItems(TABLES.WORKOUTS, { Limit: 1 });
      return true;
    } catch (error) {
      console.error('DynamoDB connection test failed:', error);
      return false;
    }
  }
}

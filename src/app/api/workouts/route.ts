import { NextRequest, NextResponse } from 'next/server';
import { dynamoOperations, TABLES } from '@/lib/dynamodb';
import { DynamoDBWorkout } from '@/lib/dynamodb-types';

// GET /api/workouts - Get workouts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let workouts: DynamoDBWorkout[] = [];

    if (date) {
      // Get workouts for specific date
      const result = await dynamoOperations.queryItems(TABLES.WORKOUTS, {
        KeyConditionExpression: 'userId = :userId AND #date = :date',
        ExpressionAttributeNames: {
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':date': date,
        },
      });
      workouts = result.Items as DynamoDBWorkout[] || [];
    } else {
      // Get all workouts for user
      const result = await dynamoOperations.queryItems(TABLES.WORKOUTS, {
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });
      workouts = result.Items as DynamoDBWorkout[] || [];
    }

    // Sort by date (newest first)
    workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

// POST /api/workouts - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, type, distance, duration, notes } = body;

    // Validation
    if (!userId || !date || !type) {
      return NextResponse.json(
        { error: 'userId, date, and type are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const workout: DynamoDBWorkout = {
      id: `${userId}-${Date.now()}`, // Simple ID generation
      userId,
      date,
      type,
      distance: distance || undefined,
      duration: duration || undefined,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoOperations.putItem(TABLES.WORKOUTS, workout);

    return NextResponse.json(
      { message: 'Workout created successfully', workout },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}

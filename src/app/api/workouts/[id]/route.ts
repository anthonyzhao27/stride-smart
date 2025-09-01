import { NextRequest, NextResponse } from 'next/server';
import { dynamoOperations, TABLES } from '@/lib/dynamodb';
import { DynamoDBWorkout } from '@/lib/dynamodb-types';

// GET /api/workouts/[id] - Get a specific workout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Extract userId from the ID (format: userId-timestamp)
    const userId = id.split('-')[0];

    const result = await dynamoOperations.getItem(TABLES.WORKOUTS, {
      id,
      userId,
    });

    if (!result.Item) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workout: result.Item });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

// PUT /api/workouts/[id] - Update a workout
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, distance, duration, notes } = body;

    // Extract userId from the ID
    const userId = id.split('-')[0];

    // Check if workout exists
    const existing = await dynamoOperations.getItem(TABLES.WORKOUTS, {
      id,
      userId,
    });

    if (!existing.Item) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Build update expression
    const updateExpression = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (type !== undefined) {
      updateExpression.push('#type = :type');
      expressionAttributeValues[':type'] = type;
      expressionAttributeNames['#type'] = 'type';
    }

    if (distance !== undefined) {
      updateExpression.push('#distance = :distance');
      expressionAttributeValues[':distance'] = distance;
      expressionAttributeNames['#distance'] = 'distance';
    }

    if (duration !== undefined) {
      updateExpression.push('#duration = :duration');
      expressionAttributeValues[':duration'] = duration;
      expressionAttributeNames['#duration'] = 'duration';
    }

    if (notes !== undefined) {
      updateExpression.push('#notes = :notes');
      expressionAttributeValues[':notes'] = notes;
      expressionAttributeNames['#notes'] = 'notes';
    }

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    expressionAttributeNames['#updatedAt'] = 'updatedAt';

    if (updateExpression.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await dynamoOperations.updateItem(
      TABLES.WORKOUTS,
      { id, userId },
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeValues
    );

    return NextResponse.json({
      message: 'Workout updated successfully',
      workout: result.Attributes,
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/[id] - Delete a workout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = id.split('-')[0];

    // Check if workout exists
    const existing = await dynamoOperations.getItem(TABLES.WORKOUTS, {
      id,
      userId,
    });

    if (!existing.Item) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    await dynamoOperations.deleteItem(TABLES.WORKOUTS, { id, userId });

    return NextResponse.json(
      { message: 'Workout deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}

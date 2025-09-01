import { NextResponse } from 'next/server';
import { dynamoOperations, TABLES } from '@/lib/dynamodb';

// GET /api/test-dynamodb - Test DynamoDB connectivity
export async function GET() {
  try {
    // Test basic connectivity by listing tables
    const result = await dynamoOperations.scanItems(TABLES.WORKOUTS, { Limit: 1 });
    
    return NextResponse.json({
      message: 'DynamoDB connection successful',
      tableName: TABLES.WORKOUTS,
      itemCount: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    });
  } catch (error) {
    console.error('DynamoDB connection test failed:', error);
    
    return NextResponse.json({
      error: 'DynamoDB connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST /api/test-dynamodb - Test DynamoDB write operation
export async function POST() {
  try {
    const testWorkout = {
      id: `test-${Date.now()}`,
      userId: 'test-user',
      date: new Date().toISOString().split('T')[0],
      type: 'test_run',
      distance: 1.0,
      duration: 5,
      notes: 'Test workout for connectivity',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test write operation
    await dynamoOperations.putItem(TABLES.WORKOUTS, testWorkout);
    
    // Test read operation
    const result = await dynamoOperations.getItem(TABLES.WORKOUTS, {
      id: testWorkout.id,
      userId: testWorkout.userId,
    });

    // Clean up test data
    await dynamoOperations.deleteItem(TABLES.WORKOUTS, {
      id: testWorkout.id,
      userId: testWorkout.userId,
    });

    return NextResponse.json({
      message: 'DynamoDB read/write test successful',
      testWorkout: result.Item,
    });
  } catch (error) {
    console.error('DynamoDB read/write test failed:', error);
    
    return NextResponse.json({
      error: 'DynamoDB read/write test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

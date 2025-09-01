import { NextRequest, NextResponse } from 'next/server';
import { MigrationUtility } from '@/lib/migration-utility';
import { DynamoDBService } from '@/lib/dynamodb-service';

// POST /api/migrate - Migrate user data from Firebase to DynamoDB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID (uid) is required' },
        { status: 400 }
      );
    }

    // Test DynamoDB connection first
    const isConnected = await DynamoDBService.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'DynamoDB connection failed. Please check your setup.' },
        { status: 500 }
      );
    }

    console.log(`Starting migration for user: ${uid}`);

    // Perform migration
    const result = await MigrationUtility.migrateUser(uid);

    if (result.success) {
      return NextResponse.json({
        message: 'Migration completed successfully',
        result,
      });
    } else {
      return NextResponse.json({
        error: 'Migration failed',
        result,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/migrate/verify?uid={uid} - Verify migration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID (uid) is required' },
        { status: 400 }
      );
    }

    // Test DynamoDB connection
    const isConnected = await DynamoDBService.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'DynamoDB connection failed. Please check your setup.' },
        { status: 500 }
      );
    }

    // Verify migration status
    const verification = await MigrationUtility.verifyMigration(uid);

    return NextResponse.json({
      message: 'Migration verification completed',
      verification,
    });

  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

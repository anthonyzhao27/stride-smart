const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
});

async function setupTables() {
  try {
    // Check if tables exist
    const listTablesResult = await client.send(new ListTablesCommand({}));
    const existingTables = listTablesResult.TableNames || [];

    // Create workouts table if it doesn't exist
    if (!existingTables.includes('workouts')) {
      console.log('Creating workouts table...');
      
      const createWorkoutsTableCommand = new CreateTableCommand({
        TableName: 'workouts',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
          { AttributeName: 'id', KeyType: 'RANGE' }      // Sort key
        ],
        AttributeDefinitions: [
          { AttributeName: 'userId', AttributeType: 'S' },
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'date', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'date-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'date', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      });

      await client.send(createWorkoutsTableCommand);
      console.log('✅ Workouts table created successfully');
    } else {
      console.log('✅ Workouts table already exists');
    }

    // Create users table if it doesn't exist
    if (!existingTables.includes('users')) {
      console.log('Creating users table...');
      
      const createUsersTableCommand = new CreateTableCommand({
        TableName: 'users',
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'email', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'email-index',
            KeySchema: [
              { AttributeName: 'email', KeyType: 'HASH' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      });

      await client.send(createUsersTableCommand);
      console.log('✅ Users table created successfully');
    } else {
      console.log('✅ Users table already exists');
    }

    console.log('\n🎉 All tables are ready!');
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
  }
}

// Run the setup
setupTables();

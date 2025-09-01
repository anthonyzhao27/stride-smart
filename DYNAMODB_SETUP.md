# DynamoDB Setup Guide

This guide will help you set up DynamoDB integration with your Next.js workout tracker application.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **IAM User** with DynamoDB access
3. **Node.js** and npm installed

## Setup Steps

### 1. Install Dependencies

The required AWS SDK packages are already installed:
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

### 2. Configure AWS Credentials

Create a `.env.local` file in your project root:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

**Important:** Never commit your actual AWS credentials to version control!

### 3. Create DynamoDB Tables

Run the setup script to create the required tables:
```bash
node scripts/setup-dynamodb.js
```

This will create:
- `workouts` table with partition key `userId` and sort key `id`
- `users` table with partition key `id`
- Global Secondary Indexes for efficient querying

### 4. Table Structure

#### Workouts Table
- **Partition Key:** `userId` (String)
- **Sort Key:** `id` (String)
- **GSI:** `date-index` for date-based queries
- **Attributes:** type, distance, duration, notes, createdAt, updatedAt

#### Users Table
- **Partition Key:** `id` (String)
- **GSI:** `email-index` for email lookups
- **Attributes:** email, name, createdAt, updatedAt

## API Endpoints

### Workouts
- `GET /api/workouts?userId={userId}` - Get all workouts for a user
- `GET /api/workouts?userId={userId}&date={date}` - Get workouts for a specific date
- `POST /api/workouts` - Create a new workout
- `GET /api/workouts/[id]` - Get a specific workout
- `PUT /api/workouts/[id]` - Update a workout
- `DELETE /api/workouts/[id]` - Delete a workout

### Request/Response Examples

#### Create Workout
```bash
POST /api/workouts
Content-Type: application/json

{
  "userId": "user123",
  "date": "2024-01-15",
  "type": "easy_run",
  "distance": 5.0,
  "duration": 30,
  "notes": "Felt good today"
}
```

#### Get User Workouts
```bash
GET /api/workouts?userId=user123
```

## Local Development

For local development, you can use DynamoDB Local:

1. **Install DynamoDB Local:**
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   ```

2. **Update environment variables:**
   ```bash
   DYNAMODB_ENDPOINT=http://localhost:8000
   ```

3. **Uncomment the endpoint line in `src/lib/dynamodb.ts`**

## Error Handling

The API includes comprehensive error handling:
- Input validation
- DynamoDB operation errors
- Proper HTTP status codes
- Detailed error messages

## Security Considerations

1. **Authentication:** Implement user authentication before allowing DynamoDB operations
2. **Authorization:** Ensure users can only access their own data
3. **Input Validation:** All inputs are validated before processing
4. **Rate Limiting:** Consider implementing rate limiting for production

## Performance Tips

1. **Use GSIs:** The date-index GSI allows efficient date-based queries
2. **Batch Operations:** For multiple operations, consider using batch APIs
3. **Pagination:** Implement pagination for large result sets
4. **Caching:** Consider caching frequently accessed data

## Troubleshooting

### Common Issues

1. **Credentials Error:** Check your AWS credentials and permissions
2. **Table Not Found:** Run the setup script to create tables
3. **Region Mismatch:** Ensure your AWS region matches the table location
4. **Permission Denied:** Verify your IAM user has DynamoDB permissions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=aws-sdk:*
```

## Next Steps

1. **Integrate with Frontend:** Update your React components to use these APIs
2. **Add Authentication:** Implement user authentication and session management
3. **Add Validation:** Enhance input validation with Zod schemas
4. **Implement Caching:** Add Redis or in-memory caching for better performance
5. **Add Monitoring:** Set up CloudWatch for monitoring and alerting

## Support

For issues related to:
- **AWS/DynamoDB:** Check AWS documentation and support
- **Next.js API Routes:** Check Next.js documentation
- **Application Logic:** Check the code comments and types

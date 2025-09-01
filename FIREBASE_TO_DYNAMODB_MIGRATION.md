# Firebase to DynamoDB Migration Guide

This guide will help you migrate your workout tracker from Firebase Firestore to DynamoDB while keeping Firebase Authentication.

## 🎯 Migration Strategy

### What We're Keeping
- ✅ **Firebase Authentication** - User login, signup, Google OAuth
- ✅ **User IDs (uid)** - Same user identification system

### What We're Migrating
- 🔄 **Firestore Collections** → **DynamoDB Tables**
- 🔄 **Workout Data** → **DynamoDB Workouts Table**
- 🔄 **User Profiles** → **DynamoDB Users Table**
- 🔄 **Workout Plans** → **DynamoDB Workout Plans Table**

## 🚀 Step-by-Step Migration

### 1. Start Local DynamoDB
```bash
# Start DynamoDB Local
npm run dynamodb:start

# Setup tables
npm run setup-dynamodb
```

### 2. Test DynamoDB Connection
```bash
# Test the connection
curl http://localhost:3000/api/test-dynamodb
```

### 3. Migrate Your Data

#### Option A: Use the Migration API
```bash
# Migrate a specific user
curl -X POST http://localhost:3000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"uid": "your-user-id-here"}'

# Verify migration
curl "http://localhost:3000/api/migrate/verify?uid=your-user-id-here"
```

#### Option B: Use the Migration Utility in Code
```typescript
import { MigrationUtility } from '@/lib/migration-utility';

// Migrate a user
const result = await MigrationUtility.migrateUser('your-user-id');
console.log('Migration result:', result);
```

### 4. Update Your Components

#### Replace Firebase Imports
```typescript
// OLD: Firebase
import { fetchWorkoutsForMonth } from '@/lib/firebaseUtils';

// NEW: DynamoDB
import { DynamoDBService } from '@/lib/dynamodb-service';
```

#### Update Function Calls
```typescript
// OLD: Firebase
const workouts = await fetchWorkoutsForMonth(startDate, uid);

// NEW: DynamoDB
const workouts = await DynamoDBService.fetchWorkoutsForMonth(startDate, uid);
```

## 🔧 Component Migration Examples

### Calendar Component
```typescript
// src/components/Calendar.tsx
import { DynamoDBService } from '@/lib/dynamodb-service';

// Replace fetchWorkoutsForMonth call
const workouts = await DynamoDBService.fetchWorkoutsForMonth(startDate, uid);
```

### WorkoutForm Component
```typescript
// src/components/WorkoutForm.tsx
import { DynamoDBService } from '@/lib/dynamodb-service';

// Replace Firebase workout creation
const workout = await DynamoDBService.createWorkout(uid, workoutData);
```

### TrainingLog Component
```typescript
// src/components/TrainingLog.tsx
import { DynamoDBService } from '@/lib/dynamodb-service';

// Replace Firebase workout fetching
const workouts = await DynamoDBService.getUserWorkouts(uid);
```

### Dashboard Component
```typescript
// src/components/Dashboard.tsx
import { DynamoDBService } from '@/lib/dynamodb-service';

// Replace Firebase operations
const workouts = await DynamoDBService.getUserWorkouts(uid);
await DynamoDBService.deleteWorkout(uid, workoutId);
```

## 📊 Data Structure Mapping

### Firestore → DynamoDB

| Firestore Collection | DynamoDB Table | Key Structure |
|---------------------|----------------|---------------|
| `users/{uid}/workouts` | `workouts` | `userId` (partition) + `id` (sort) |
| `users/{uid}` | `users` | `id` (partition) |
| `workout_plans` | `workout_plans` | `userId` (partition) + `id` (sort) |

### Field Mappings

#### Workout Fields
```typescript
// Firestore
{
  id: "doc-id",
  name: "Easy Run",
  timestamp: Timestamp,
  duration: 30,
  distance: 3.1,
  // ... other fields
}

// DynamoDB
{
  id: "uid-timestamp",
  userId: "uid",
  name: "Easy Run",
  timestamp: "2024-01-15T10:30:00.000Z",
  duration: 30,
  distance: 3.1,
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Testing the Migration

### 1. Test DynamoDB Operations
```bash
# Test basic operations
curl http://localhost:3000/api/test-dynamodb

# Test workout creation
curl -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "date": "2024-01-15",
    "type": "easy_run",
    "distance": 3.1,
    "duration": 30
  }'
```

### 2. Verify Data Consistency
```bash
# Check migration status
curl "http://localhost:3000/api/migrate/verify?uid=your-user-id"
```

### 3. Test Frontend Integration
- Navigate to your app
- Try creating a new workout
- Check if data appears in DynamoDB
- Verify calendar and training log display correctly

## 🔄 Gradual Migration Approach

### Phase 1: Setup & Test
- [ ] Start local DynamoDB
- [ ] Create tables
- [ ] Test basic operations
- [ ] Verify connection

### Phase 2: Data Migration
- [ ] Migrate existing user data
- [ ] Verify data integrity
- [ ] Test read operations

### Phase 3: Component Updates
- [ ] Update Calendar component
- [ ] Update WorkoutForm component
- [ ] Update TrainingLog component
- [ ] Update Dashboard component

### Phase 4: Testing & Validation
- [ ] Test all CRUD operations
- [ ] Verify data consistency
- [ ] Performance testing
- [ ] User acceptance testing

### Phase 5: Production Deployment
- [ ] Deploy to production DynamoDB
- [ ] Migrate production data
- [ ] Monitor performance
- [ ] Rollback plan ready

## 🚨 Rollback Plan

If something goes wrong, you can easily rollback:

1. **Keep Firebase running** during migration
2. **Test thoroughly** before switching
3. **Gradual rollout** - migrate one component at a time
4. **Monitor closely** for any issues
5. **Quick rollback** - just change imports back to Firebase

## 📝 Migration Checklist

- [ ] Local DynamoDB running
- [ ] Tables created successfully
- [ ] Connection tested
- [ ] Migration utility tested
- [ ] Sample data migrated
- [ ] Data verified
- [ ] Components updated
- [ ] Frontend tested
- [ ] Performance validated
- [ ] Ready for production

## 🆘 Troubleshooting

### Common Issues

1. **DynamoDB Connection Failed**
   - Check if Docker is running
   - Verify port 8000 is available
   - Check environment variables

2. **Migration Errors**
   - Verify Firebase connection
   - Check user permissions
   - Review error logs

3. **Data Inconsistencies**
   - Run verification API
   - Compare record counts
   - Check for missing fields

### Debug Commands
```bash
# Check DynamoDB status
npm run dynamodb:logs

# Test connection
curl http://localhost:3000/api/test-dynamodb

# Verify migration
curl "http://localhost:3000/api/migrate/verify?uid=test-user"
```

## 🎉 Benefits of Migration

- **Cost Savings**: DynamoDB can be more cost-effective for high-traffic apps
- **Performance**: Better query performance for large datasets
- **Scalability**: Automatic scaling with AWS infrastructure
- **Consistency**: ACID compliance for critical operations
- **Integration**: Better AWS ecosystem integration

## 📚 Next Steps

After successful migration:

1. **Monitor Performance**: Watch DynamoDB metrics
2. **Optimize Queries**: Use GSIs effectively
3. **Add Caching**: Implement Redis if needed
4. **Backup Strategy**: Set up DynamoDB backups
5. **Cost Optimization**: Monitor and optimize costs

---

**Need Help?** Check the logs, test endpoints, and verify your setup step by step!

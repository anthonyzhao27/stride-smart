import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { DynamoDBService } from "./dynamodb-service";
import { LoggedWorkout, User } from "./types";

// Migration Utility: Firebase → DynamoDB
export class MigrationUtility {
  
  // Migrate all workouts for a user from Firebase to DynamoDB
  static async migrateUserWorkouts(uid: string): Promise<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // Get all workouts from Firebase
      const workoutsQuery = query(
        collection(db, 'users', uid, "workouts")
      );
      
      const snapshot = await getDocs(workoutsQuery);
      
      if (snapshot.empty) {
        return { success: true, migratedCount: 0, errors: [] };
      }

      // Migrate each workout
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          const ts = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);

          const workoutData: Omit<LoggedWorkout, 'id'> = {
            name: data.name || 'Untitled Workout',
            timestamp: ts,
            date: ts.toDateString().split("T")[0],
            time: `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`,
            duration: data.duration || 0,
            distance: data.distance,
            unit: data.unit || 'miles',
            type: data.type || 'unknown',
            effortLevel: data.effortLevel || 'medium',
            notes: data.notes || '',
          };

          await DynamoDBService.createWorkout(uid, workoutData);
          migratedCount++;
        } catch (error) {
          const errorMsg = `Failed to migrate workout ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return { success: true, migratedCount, errors };
    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      return { success: false, migratedCount, errors };
    }
  }

  // Migrate user profile from Firebase to DynamoDB
  static async migrateUserProfile(uid: string): Promise<{
    success: boolean;
    migrated: boolean;
    error?: string;
  }> {
    try {
      // Check if user profile already exists in DynamoDB
      const existingProfile = await DynamoDBService.getUserProfile(uid);
      if (existingProfile) {
        return { success: true, migrated: false, error: 'Profile already exists in DynamoDB' };
      }

      // Get user profile from Firebase
      const userDoc = await getDocs(collection(db, 'users'));
      let userData: User | null = null;

      userDoc.forEach((doc) => {
        if (doc.id === uid) {
          userData = doc.data() as User;
        }
      });

      if (!userData) {
        return { success: true, migrated: false, error: 'No user profile found in Firebase' };
      }

      // Migrate to DynamoDB
      await DynamoDBService.setUserProfile(uid, userData);
      
      return { success: true, migrated: true };
    } catch (error) {
      const errorMsg = `Profile migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      return { success: false, migrated: false, error: errorMsg };
    }
  }

  // Complete migration for a user
  static async migrateUser(uid: string): Promise<{
    success: boolean;
    workouts: { migratedCount: number; errors: string[] };
    profile: { migrated: boolean; error?: string };
  }> {
    console.log(`Starting migration for user: ${uid}`);

    // Migrate workouts
    const workoutsResult = await this.migrateUserWorkouts(uid);
    
    // Migrate profile
    const profileResult = await this.migrateUserProfile(uid);

    const overallSuccess = workoutsResult.success && profileResult.success;

    console.log(`Migration completed for user: ${uid}`);
    console.log(`- Workouts migrated: ${workoutsResult.migratedCount}`);
    console.log(`- Profile migrated: ${profileResult.migrated}`);
    console.log(`- Overall success: ${overallSuccess}`);

    return {
      success: overallSuccess,
      workouts: {
        migratedCount: workoutsResult.migratedCount,
        errors: workoutsResult.errors,
      },
      profile: {
        migrated: profileResult.migrated,
        error: profileResult.error,
      },
    };
  }

  // Verify migration by comparing data counts
  static async verifyMigration(uid: string): Promise<{
    firebaseWorkoutCount: number;
    dynamodbWorkoutCount: number;
    firebaseProfileExists: boolean;
    dynamodbProfileExists: boolean;
    migrationComplete: boolean;
  }> {
    try {
      // Count Firebase workouts
      const firebaseWorkouts = query(collection(db, 'users', uid, "workouts"));
      const firebaseSnapshot = await getDocs(firebaseWorkouts);
      const firebaseWorkoutCount = firebaseSnapshot.size;

      // Count DynamoDB workouts
      const dynamodbWorkouts = await DynamoDBService.getUserWorkouts(uid);
      const dynamodbWorkoutCount = dynamodbWorkouts.length;

      // Check Firebase profile
      const firebaseProfile = await getDocs(collection(db, 'users'));
      let firebaseProfileExists = false;
      firebaseProfile.forEach((doc) => {
        if (doc.id === uid) {
          firebaseProfileExists = true;
        }
      });

      // Check DynamoDB profile
      const dynamodbProfile = await DynamoDBService.getUserProfile(uid);
      const dynamodbProfileExists = !!dynamodbProfile;

      const migrationComplete = 
        firebaseWorkoutCount === dynamodbWorkoutCount && 
        firebaseProfileExists === dynamodbProfileExists;

      return {
        firebaseWorkoutCount,
        dynamodbWorkoutCount,
        firebaseProfileExists,
        dynamodbProfileExists,
        migrationComplete,
      };
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  }
}

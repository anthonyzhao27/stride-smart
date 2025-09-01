// Simple test script for AI functions
// Run with: node test-ai-functions.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, orderBy, doc, getDoc } = require('firebase/firestore');

// Firebase config - you'll need to add your config here
const firebaseConfig = {
    // Add your Firebase config here
    // apiKey: "your-api-key",
    // authDomain: "your-auth-domain",
    // projectId: "your-project-id",
    // storageBucket: "your-storage-bucket",
    // messagingSenderId: "your-messaging-sender-id",
    // appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test configuration - REPLACE WITH YOUR ACTUAL USER ID
const TEST_USER_ID = 'your-test-user-id'; // Replace with actual user ID
const TEST_PLAN_ID = 'current-plan';

// Mock functions for testing (since we can't import TypeScript directly)
async function getWorkoutForDate(date, userId, planId) {
    try {
        console.log(`🔍 Looking for workout on ${date.toDateString()} for user ${userId}...`);
        
        if (planId === 'current-plan' || planId === 'default') {
            const plansRef = collection(db, "users", userId, "plans");
            const plansQuery = query(plansRef, orderBy('week', 'asc'));
            const querySnapshot = await getDocs(plansQuery);
            
            if (querySnapshot.empty) {
                return {
                    workout: null,
                    found: false,
                    message: "No plans found for user"
                };
            }
            
            console.log(`📅 Found ${querySnapshot.docs.length} weeks`);
            
            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                const workouts = data.workouts || [];
                
                console.log(`Week ${data.week}: ${workouts.length} workouts`);
                
                for (const workout of workouts) {
                    const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                    
                    if (workoutDate.toDateString() === date.toDateString()) {
                        return {
                            workout: {
                                ...workout,
                                date: workoutDate,
                                weekId: doc.id,
                                weekNumber: data.week
                            },
                            found: true
                        };
                    }
                }
            }
        } else {
            const planRef = doc(db, "users", userId, "plans", planId);
            const planSnap = await getDoc(planRef);
            
            if (!planSnap.exists()) {
                return {
                    workout: null,
                    found: false,
                    message: "Plan not found"
                };
            }
            
            const data = planSnap.data();
            const workouts = data.workouts || [];
            
            for (const workout of workouts) {
                const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                
                if (workoutDate.toDateString() === date.toDateString()) {
                    return {
                        workout: {
                            ...workout,
                            date: workoutDate,
                            weekId: planSnap.id,
                            weekNumber: data.week
                        },
                        found: true
                    };
                }
            }
        }
        
        return {
            workout: null,
            found: false,
            message: `No workout scheduled for ${date.toDateString()}`
        };
        
    } catch (error) {
        console.error("Error retrieving workout for date:", error);
        return {
            workout: null,
            found: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

async function getTrainingLoad(userId, days) {
    try {
        console.log(`📊 Getting training load for last ${days} days...`);
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const plansRef = collection(db, "users", userId, "plans");
        const plansQuery = query(plansRef, orderBy('week', 'asc'));
        const querySnapshot = await getDocs(plansQuery);
        
        let totalDistance = 0;
        let totalDuration = 0;
        let workoutCount = 0;
        let recoveryDays = 0;
        
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const workouts = data.workouts || [];
            
            for (const workout of workouts) {
                const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                
                if (workoutDate >= startDate && workoutDate <= endDate) {
                    totalDistance += workout.distance || 0;
                    totalDuration += workout.duration || 0;
                    workoutCount++;
                    
                    if (workout.tags === 'Easy' || workout.distance === 0) {
                        recoveryDays++;
                    }
                }
            }
        }
        
        return {
            totalDistance,
            totalDuration,
            workoutCount,
            recoveryDays,
            averageDistance: workoutCount > 0 ? totalDistance / workoutCount : 0,
            averageDuration: workoutCount > 0 ? totalDuration / workoutCount : 0,
            recoveryRate: workoutCount > 0 ? recoveryDays / workoutCount : 0
        };
    } catch (error) {
        console.error("Error retrieving training load:", error);
        return {
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

async function getUserPreferences(userId) {
    try {
        console.log(`👤 Getting user preferences for ${userId}...`);
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            return {
                found: false,
                message: "User not found"
            };
        }
        
        const data = userSnap.data();
        return {
            found: true,
            preferences: {
                experience: data.experience || 'beginner',
                goals: data.goals || [],
                preferredDistance: data.preferredDistance || '5k',
                trainingDays: data.trainingDays || 4,
                maxDistance: data.maxDistance || 10
            }
        };
    } catch (error) {
        console.error("Error retrieving user preferences:", error);
        return {
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

async function testAllFunctions() {
    console.log('🧪 Testing AI System Functions...\n');
    
    if (TEST_USER_ID === 'your-test-user-id') {
        console.log('❌ Please update TEST_USER_ID in the script with your actual user ID');
        console.log('📝 Edit line 15 in test-ai-functions.js');
        return;
    }
    
    try {
        // Test 1: Get today's workout
        console.log('1️⃣ Testing getWorkoutForDate...');
        const todayWorkout = await getWorkoutForDate(new Date(), TEST_USER_ID, TEST_PLAN_ID);
        console.log('Today\'s workout:', JSON.stringify(todayWorkout, null, 2));
        console.log('✅ getWorkoutForDate test completed\n');
        
        // Test 2: Get training load (last 7 days)
        console.log('2️⃣ Testing getTrainingLoad...');
        const trainingLoad = await getTrainingLoad(TEST_USER_ID, 7);
        console.log('Training load (7 days):', JSON.stringify(trainingLoad, null, 2));
        console.log('✅ getTrainingLoad test completed\n');
        
        // Test 3: Get user preferences
        console.log('3️⃣ Testing getUserPreferences...');
        const userPrefs = await getUserPreferences(TEST_USER_ID);
        console.log('User preferences:', JSON.stringify(userPrefs, null, 2));
        console.log('✅ getUserPreferences test completed\n');
        
        // Test 4: Test with specific date
        console.log('4️⃣ Testing getWorkoutForDate with specific date...');
        const specificDate = new Date('2024-01-15'); // Replace with actual date
        const specificWorkout = await getWorkoutForDate(specificDate, TEST_USER_ID, TEST_PLAN_ID);
        console.log(`Workout for ${specificDate.toDateString()}:`, JSON.stringify(specificWorkout, null, 2));
        console.log('✅ Specific date test completed\n');
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
}

// Run tests
testAllFunctions();

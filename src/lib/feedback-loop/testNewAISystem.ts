// Test script for the new AI system functions
// Run this with: npx ts-node src/lib/feedback-loop/testNewAISystem.ts

import { retrieveData, getWorkoutForDate, getTrainingLoad, getUserPreferences, getTrainingHistory, analyzeRecoveryPatterns } from './newAISystem';

// Test configuration
const TEST_USER_ID = 'your-test-user-id'; // Replace with actual user ID
const TEST_PLAN_ID = 'current-plan'; // or specific plan ID

async function testAllFunctions() {
    console.log('🧪 Testing New AI System Functions...\n');
    
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
        
        // Test 4: Get training history (last 30 days)
        console.log('4️⃣ Testing getTrainingHistory...');
        const trainingHistory = await getTrainingHistory(TEST_USER_ID, 30);
        console.log('Training history (30 days):', JSON.stringify(trainingHistory, null, 2));
        console.log('✅ getTrainingHistory test completed\n');
        
        // Test 5: Analyze recovery patterns
        console.log('5️⃣ Testing analyzeRecoveryPatterns...');
        const recoveryPatterns = await analyzeRecoveryPatterns(TEST_USER_ID, 30);
        console.log('Recovery patterns:', JSON.stringify(recoveryPatterns, null, 2));
        console.log('✅ analyzeRecoveryPatterns test completed\n');
        
        // Test 6: Test retrieveData with all data types
        console.log('6️⃣ Testing retrieveData with all data types...');
        const allData = await retrieveData([
            'today_workout',
            'recent_training_load', 
            'user_preferences',
            'training_history',
            'recovery_patterns'
        ], TEST_USER_ID, TEST_PLAN_ID);
        console.log('All retrieved data:', JSON.stringify(allData, null, 2));
        console.log('✅ retrieveData test completed\n');
        
        // Test 7: Test with specific date
        console.log('7️⃣ Testing getWorkoutForDate with specific date...');
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

// Test individual functions
async function testIndividualFunction(functionName: string, testFunction: () => Promise<any>) {
    console.log(`🧪 Testing ${functionName}...`);
    try {
        const result = await testFunction();
        console.log(`${functionName} result:`, JSON.stringify(result, null, 2));
        console.log(`✅ ${functionName} test completed\n`);
        return result;
    } catch (error) {
        console.error(`❌ ${functionName} test failed:`, error);
        return null;
    }
}

// Individual test functions
async function testGetWorkoutForDate() {
    return await getWorkoutForDate(new Date(), TEST_USER_ID, TEST_PLAN_ID);
}

async function testGetTrainingLoad() {
    return await getTrainingLoad(TEST_USER_ID, 7);
}

async function testGetUserPreferences() {
    return await getUserPreferences(TEST_USER_ID);
}

async function testGetTrainingHistory() {
    return await getTrainingHistory(TEST_USER_ID, 30);
}

async function testAnalyzeRecoveryPatterns() {
    return await analyzeRecoveryPatterns(TEST_USER_ID, 30);
}

async function testRetrieveData() {
    return await retrieveData(['today_workout', 'recent_training_load'], TEST_USER_ID, TEST_PLAN_ID);
}

// Export for use in other files
export {
    testAllFunctions,
    testIndividualFunction,
    testGetWorkoutForDate,
    testGetTrainingLoad,
    testGetUserPreferences,
    testGetTrainingHistory,
    testAnalyzeRecoveryPatterns,
    testRetrieveData
};

// Run tests if this file is executed directly
if (require.main === module) {
    testAllFunctions();
}

// Test script for Firestore saving functionality
// Run this with: npx ts-node src/lib/feedback-loop/testFirestoreSave.ts

import { firestoreRepo } from './firestoreRepo';
import { TrainingWeek, TrainingWorkout } from '@/lib/types';

// Test configuration
const TEST_USER_ID = 'test_user_123'; // Test user ID
const TEST_PLAN_ID = 'current-plan'; // Test plan ID

// Mock data for testing
const mockTrainingWeek: TrainingWeek = {
  id: "test_week_1",
  week: 1,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-07"),
  totalMileage: 25.5,
  totalDuration: 180,
  description: "Test week for Firestore saving",
  workouts: [
    {
      name: "Easy Run",
      date: new Date("2024-01-01"),
      distance: 5,
      duration: 45,
      tags: "Easy",
      notes: "Test workout 1"
    } as TrainingWorkout,
    {
      name: "Tempo Run",
      date: new Date("2024-01-03"),
      distance: 8,
      duration: 60,
      tags: "LT2",
      notes: "Test workout 2"
    } as TrainingWorkout
  ]
};

const mockWeek2: TrainingWeek = {
  id: "test_week_2",
  week: 2,
  startDate: new Date("2024-01-08"),
  endDate: new Date("2024-01-14"),
  totalMileage: 12,
  totalDuration: 90,
  description: "Test week 2 for Firestore saving",
  workouts: [
    {
      name: "Long Run",
      date: new Date("2024-01-08"),
      distance: 12,
      duration: 90,
      tags: "Easy",
      notes: "Test long run"
    } as TrainingWorkout
  ]
};

// Test the savePlan function
async function testSavePlan() {
  try {
    console.log('🧪 Testing Firestore savePlan functionality...\n');
    
    // Test 1: Save a single week to 'current-plan'
    console.log('1️⃣ Test 1: Saving to current-plan');
    const result1 = await firestoreRepo.savePlan(
      TEST_USER_ID,
      TEST_PLAN_ID,
      [mockTrainingWeek],
      0,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Save result:', result1);
    console.log('✅ Single week save test completed\n');
    
    // Test 2: Save multiple weeks
    console.log('2️⃣ Test 2: Saving multiple weeks');
    const result2 = await firestoreRepo.savePlan(
      TEST_USER_ID,
      TEST_PLAN_ID,
      [mockTrainingWeek, mockWeek2],
      1,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Multiple weeks save result:', result2);
    console.log('✅ Multiple weeks save test completed\n');
    
    // Test 3: Save to a specific plan ID (legacy mode)
    console.log('3️⃣ Test 3: Saving to specific plan ID (legacy mode)');
    const result3 = await firestoreRepo.savePlan(
      TEST_USER_ID,
      'specific-plan-123',
      [mockTrainingWeek],
      0,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Legacy plan save result:', result3);
    console.log('✅ Legacy plan save test completed\n');
    
    // Test 4: Test version incrementing
    console.log('4️⃣ Test 4: Testing version incrementing');
    const result4 = await firestoreRepo.savePlan(
      TEST_USER_ID,
      TEST_PLAN_ID,
      [mockTrainingWeek],
      2, // Expected version 2
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Version increment result:', result4);
    console.log('✅ Version increment test completed\n');
    
    console.log('🎉 All Firestore save tests completed successfully!');
    
    return {
      success: true,
      results: [result1, result2, result3, result4]
    };
    
  } catch (error) {
    console.error('❌ Firestore save test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test individual save scenarios
async function testSingleWeekSave() {
  console.log('🧪 Testing single week save...');
  try {
    const result = await firestoreRepo.savePlan(
      TEST_USER_ID,
      TEST_PLAN_ID,
      [mockTrainingWeek],
      0,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Single week save result:', result);
    return result;
  } catch (error) {
    console.error('❌ Single week save test failed:', error);
    return null;
  }
}

async function testMultipleWeeksSave() {
  console.log('🧪 Testing multiple weeks save...');
  try {
    const result = await firestoreRepo.savePlan(
      TEST_USER_ID,
      TEST_PLAN_ID,
      [mockTrainingWeek, mockWeek2],
      0,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Multiple weeks save result:', result);
    return result;
  } catch (error) {
    console.error('❌ Multiple weeks save test failed:', error);
    return null;
  }
}

async function testLegacyPlanSave() {
  console.log('🧪 Testing legacy plan save...');
  try {
    const result = await firestoreRepo.savePlan(
      TEST_USER_ID,
      'legacy-plan-456',
      [mockTrainingWeek],
      0,
      {
        atISO: new Date().toISOString(),
        actor: "TEST_SCRIPT",
        operations: [],
        changeset: [],
        warnings: []
      }
    );
    console.log('✅ Legacy plan save result:', result);
    return result;
  } catch (error) {
    console.error('❌ Legacy plan save test failed:', error);
    return null;
  }
}

// Export for use in other files
export {
  testSavePlan,
  testSingleWeekSave,
  testMultipleWeeksSave,
  testLegacyPlanSave,
  mockTrainingWeek,
  mockWeek2
};

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting Firestore save tests...');
  console.log('⚠️  Make sure your Firebase configuration is set up correctly!');
  console.log('⚠️  You may need to set up environment variables or Firebase config');
  
  testSavePlan().then((result) => {
    if (result.success) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n❌ Some tests failed. Check the error details above.');
    }
  });
}

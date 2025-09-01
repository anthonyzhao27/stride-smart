# Testing the New AI System with Firestore Integration

## 🎯 **How the New AI System Modifies Firestore**

### **Data Flow**
1. **User Request** → Natural language input (e.g., "I'm tired from yesterday's run")
2. **AI Processing** → Converts to structured request with actions
3. **Data Retrieval** → Fetches current plan from Firestore
4. **Action Processing** → Applies modifications to workout data
5. **Firestore Update** → Saves modified plan back to database
6. **Response Generation** → Returns AI-generated explanation and suggestions

### **Firestore Structure**
```
users/{userId}/plans/{weekId}
├── week: number
├── startDate: Date
├── endDate: Date
├── totalMileage: number
├── totalDuration: number
├── description: string
├── workouts: Array<{
│   ├── name: string
│   ├── date: Date
│   ├── distance: number
│   ├── duration: number
│   ├── tags: string
│   ├── notes: string
│   └── ...
│ }>
└── ...
```

### **Modification Types**
- **`adjust_workout_intensity`** → Changes workout distance, intensity, and notes
- **`skip_workout`** → Converts workout to rest day (distance: 0, duration: 0)
- **`add_recovery`** → Reduces workout intensity and distance for recovery

## 🧪 **Testing the System**

### **Prerequisites**
1. **Firebase Setup** ✅
   - Firebase project configured
   - Firestore database initialized
   - User authentication working

2. **Test Data** ✅
   - User with training plans in Firestore
   - Workouts scheduled for today/current date

3. **Environment Variables** ✅
   - `OPENAI_API_KEY` set
   - Firebase config in place

### **Test 1: Basic Data Retrieval**

**Endpoint**: `GET /api/test-ai-functions?userId=YOUR_USER_ID`

**Expected Response**:
```json
{
  "success": true,
  "userId": "your-user-id",
  "planId": "current-plan",
  "testType": "all",
  "results": {
    "workout": {
      "workout": {
        "name": "Easy Run",
        "distance": 3,
        "duration": 30,
        "tags": "Easy",
        "date": "2024-01-15T00:00:00.000Z"
      },
      "found": true
    },
    "trainingLoad": {
      "totalDistance": 25.5,
      "workoutCount": 5,
      "recoveryDays": 2
    }
  }
}
```

### **Test 2: AI System with Modifications**

**Endpoint**: `POST /api/planFeedback`

**Request**:
```json
{
  "message": "I'm tired from yesterday's run, make today's workout easier",
  "userId": "YOUR_USER_ID",
  "planId": "current-plan"
}
```

**Expected Response**:
```json
{
  "planId": "current-plan",
  "toVersion": 0,
  "updatedWeeks": [
    {
      "id": "week-1",
      "week": 1,
      "workouts": [
        {
          "name": "Easy Run",
          "distance": 2.1, // Reduced from 3.0
          "duration": 30,
          "tags": "Easy",
          "notes": "Modified for recovery - reduced intensity and distance"
        }
      ]
    }
  ],
  "warnings": [],
  "explanation": "I understand you're feeling tired from yesterday's run. I've made today's workout easier to help with recovery...",
  "suggestions": [
    "Focus on easy, conversational pace",
    "Stay hydrated throughout the day",
    "Consider light stretching or foam rolling"
  ]
}
```

### **Test 3: Workout Explanation**

**Request**:
```json
{
  "message": "Explain today's workout",
  "userId": "YOUR_USER_ID",
  "planId": "current-plan"
}
```

**Expected Response**:
```json
{
  "planId": "current-plan",
  "toVersion": 0,
  "updatedWeeks": [],
  "warnings": [],
  "explanation": "Today's workout is an Easy Run covering 3 miles in 30 minutes. This type of workout is designed to build your aerobic base while promoting recovery...",
  "suggestions": [
    "Keep your pace conversational",
    "Focus on good running form",
    "Stay hydrated during the run"
  ]
}
```

### **Test 4: Skip Workout**

**Request**:
```json
{
  "message": "I need to skip today's workout",
  "userId": "YOUR_USER_ID",
  "planId": "current-plan"
}
```

**Expected Response**:
```json
{
  "planId": "current-plan",
  "toVersion": 0,
  "updatedWeeks": [
    {
      "id": "week-1",
      "week": 1,
      "workouts": [
        {
          "name": "Rest Day",
          "distance": 0,
          "duration": 0,
          "tags": "Easy",
          "notes": "Skipped due to user feedback - rest day recommended"
        }
      ]
    }
  ],
  "warnings": [],
  "explanation": "I've scheduled a rest day for today. Rest is crucial for recovery and preventing overtraining...",
  "suggestions": [
    "Consider light stretching or yoga",
    "Stay active with walking",
    "Focus on good nutrition and hydration"
  ]
}
```

## 🔍 **Verifying Firestore Changes**

### **Method 1: Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore Database
3. Find your user: `users/{userId}/plans/{weekId}`
4. Check the `workouts` array for modifications

### **Method 2: API Verification**
```bash
# Check the updated plan
curl -X GET "http://localhost:3000/api/test-ai-functions?userId=YOUR_USER_ID&test=workout"
```

### **Method 3: Database Query**
```javascript
// In Firebase Console or your app
const userRef = doc(db, "users", "YOUR_USER_ID", "plans", "week-1");
const userSnap = await getDoc(userRef);
const data = userSnap.data();
console.log("Updated workouts:", data.workouts);
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"No workout found for today"**
   - **Cause**: No workout scheduled for current date
   - **Solution**: Create a workout for today in your test data

2. **"Plan not found"**
   - **Cause**: User doesn't have training plans
   - **Solution**: Create test plans for the user

3. **"Error saving updated plan to Firestore"**
   - **Cause**: Firebase permissions or configuration issues
   - **Solution**: Check Firebase rules and configuration

4. **"Unknown action type"**
   - **Cause**: AI generated an unsupported action
   - **Solution**: Check the action types in the code

### **Debug Steps**

1. **Check Console Logs**:
   ```bash
   # Look for these log messages:
   "=== Starting NEW AI system ==="
   "Flexible request:"
   "Retrieved data:"
   "Processing action:"
   "Saving updated plan for user"
   "Successfully saved updated plan to Firestore"
   ```

2. **Verify Data Structure**:
   ```javascript
   // Check if your workout data has the correct structure
   {
     name: "Easy Run",
     date: new Date(), // Must be today's date
     distance: 3,
     duration: 30,
     tags: "Easy"
   }
   ```

3. **Test with Different Dates**:
   ```bash
   # Test with a specific date that has a workout
   curl -X POST http://localhost:3000/api/planFeedback \
     -H "Content-Type: application/json" \
     -d '{"message": "Make tomorrow\'s workout easier", "userId": "YOUR_USER_ID", "planId": "current-plan"}'
   ```

## 🎯 **Success Criteria**

### **Functional Tests**
- ✅ **Data Retrieval**: Successfully fetches user data from Firestore
- ✅ **Action Processing**: Correctly applies workout modifications
- ✅ **Firestore Updates**: Successfully saves changes to database
- ✅ **AI Responses**: Generates natural, helpful responses
- ✅ **Error Handling**: Gracefully handles errors and edge cases

### **Performance Tests**
- ✅ **Response Time**: < 3 seconds for complete request
- ✅ **Data Accuracy**: Modifications are applied correctly
- ✅ **Consistency**: Same input produces consistent results

### **User Experience Tests**
- ✅ **Natural Language**: Understands various ways to express requests
- ✅ **Helpful Responses**: Provides educational and actionable content
- ✅ **Personalization**: Tailors responses to user's context

## 🚀 **Next Steps**

1. **Test with Real Users**: Get feedback from actual users
2. **Monitor Performance**: Track response times and error rates
3. **Enhance Actions**: Add more action types (move workouts, add workouts)
4. **Improve AI**: Refine prompts for better responses
5. **Add Analytics**: Track usage patterns and user satisfaction

**Your new AI system is now fully functional with Firestore integration!** 🎉

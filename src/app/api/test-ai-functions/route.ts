import { NextRequest, NextResponse } from "next/server";
import { retrieveData, getWorkoutForDate, getTrainingLoad, getUserPreferences, getTrainingHistory, analyzeRecoveryPatterns } from "@/lib/feedback-loop/newAISystem";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const planId = searchParams.get('planId') || 'current-plan';
    const testType = searchParams.get('test') || 'all';
    
    if (!userId) {
        return NextResponse.json({ 
            error: "Missing userId parameter. Use ?userId=your-user-id" 
        }, { status: 400 });
    }
    
    console.log(`🧪 Testing AI functions for user: ${userId}, plan: ${planId}, test: ${testType}`);
    
    try {
        const results: Record<string, unknown> = {};
        
        switch (testType) {
            case 'workout':
                results.workout = await getWorkoutForDate(new Date(), userId, planId);
                break;
                
            case 'training-load':
                results.trainingLoad = await getTrainingLoad(userId, 7);
                break;
                
            case 'preferences':
                results.preferences = await getUserPreferences(userId);
                break;
                
            case 'history':
                results.history = await getTrainingHistory(userId, 30);
                break;
                
            case 'recovery':
                results.recovery = await analyzeRecoveryPatterns(userId, 30);
                break;
                
            case 'all':
            default:
                // Test all functions
                results.workout = await getWorkoutForDate(new Date(), userId, planId);
                results.trainingLoad = await getTrainingLoad(userId, 7);
                results.preferences = await getUserPreferences(userId);
                results.history = await getTrainingHistory(userId, 30);
                results.recovery = await analyzeRecoveryPatterns(userId, 30);
                
                // Test retrieveData with all data types
                results.allData = await retrieveData([
                    'today_workout',
                    'recent_training_load',
                    'user_preferences',
                    'training_history',
                    'recovery_patterns'
                ], userId, planId);
                break;
        }
        
        return NextResponse.json({
            success: true,
            userId,
            planId,
            testType,
            results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Test failed:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Unknown error",
            userId,
            planId,
            testType
        }, { status: 500 });
    }
}

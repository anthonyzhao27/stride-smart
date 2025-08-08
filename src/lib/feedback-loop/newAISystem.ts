// New AI System - Flexible Schema-Based Approach
// This is a prototype implementation of the new AI system

import { OpenAI } from "openai";
import { collection, query, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { firestoreRepo } from "./firestoreRepo";
import { TrainingWeek, TrainingWorkout } from "@/lib/types";

// Core types for the new flexible system
export interface NewAIRequest {
    intent: string;
    context: Record<string, unknown>;
    dataNeeded?: string[];
    actions?: NewAIAction[];
    response?: NewResponseConfig;
    originalMessage?: string; // Added for context in AI response generation
}

export interface NewAIAction {
    type: string;
    parameters: Record<string, unknown>;
    reasoning: string;
    confidence: number;
    result?: Record<string, unknown>; // Added for action results
}

export interface NewResponseConfig {
    tone: "encouraging" | "educational" | "supportive";
    includeTips: boolean;
    includeRecovery: boolean;
    sections: string[];
}

export interface NewAIResponse {
    content: string;
    actions?: NewAIAction[];
    data?: Record<string, unknown>;
    suggestions?: string[];
    updatedWeeks?: TrainingWeek[]; // Added for Firestore updates
}

// New AI system implementation
export async function processWithNewAI(
    message: string, 
    userId: string, 
    planId: string
): Promise<NewAIResponse> {
    console.log("=== Starting NEW AI system ===");
    console.log(`Message: "${message}"`);
    console.log(`User ID: ${userId}`);
    console.log(`Plan ID: ${planId}`);
    
    try {
        // 1. Generate flexible request using function calling
        console.log("1. Generating flexible request...");
        const flexibleRequest = await generateFlexibleRequest(message);
        console.log("Flexible request:", JSON.stringify(flexibleRequest, null, 2));
        
        // 2. Retrieve needed data
        console.log("2. Retrieving data...");
        const data = await retrieveData(flexibleRequest.dataNeeded || [], userId, planId, flexibleRequest.actions);
        console.log("Retrieved data keys:", Object.keys(data));
        
        // 3. Process actions if any
        console.log("3. Processing actions...");
        const processedActions = [];
        let updatedWeeks: TrainingWeek[] = [];
        
        if (flexibleRequest.actions && flexibleRequest.actions.length > 0) {
            console.log(`Found ${flexibleRequest.actions.length} actions to process`);
            
            // Get current plan data for modifications
            const currentPlan = await getCurrentPlan(userId, planId);
            console.log(`Retrieved current plan with ${currentPlan.length} weeks`);
            
            for (const action of flexibleRequest.actions) {
                console.log(`Processing action: ${action.type}`, JSON.stringify(action, null, 2));
                const processedAction = await processAction(action, data);
                if (processedAction) {
                    processedActions.push(processedAction);
                    console.log(`Action processed successfully:`, JSON.stringify(processedAction, null, 2));
                    
                    // Apply modifications to the plan if needed
                    if (processedAction.result && !processedAction.result.error) {
                        console.log("Applying modifications to plan...");
                        updatedWeeks = await applyModificationsToPlan(
                            currentPlan, 
                            processedAction, 
                            userId, 
                            planId
                        );
                        console.log(`Plan modifications applied. Updated weeks: ${updatedWeeks.length}`);
                    } else {
                        console.log("No modifications to apply (action had error or no result)");
                    }
                }
            }
        } else {
            console.log("No actions to process");
        }
        
        // 4. Generate AI response
        console.log("4. Generating AI response...");
        const response = await generateAIResponse(flexibleRequest, data, processedActions);
        
        // 5. Generate suggestions
        console.log("5. Generating suggestions...");
        const suggestions = await generateSuggestions(flexibleRequest, data);
        
        // 6. Return structured response
        console.log("6. Returning structured response...");
        const finalResponse = {
            content: response,
            actions: processedActions,
            data: data,
            suggestions: suggestions,
            updatedWeeks: updatedWeeks
        };
        
        console.log("=== NEW AI SYSTEM COMPLETE ===");
        console.log("Final response structure:", JSON.stringify({
            contentLength: response.length,
            actionCount: processedActions.length,
            dataKeys: Object.keys(data),
            suggestionCount: suggestions.length,
            updatedWeeksCount: updatedWeeks.length
        }, null, 2));
        
        return finalResponse;
        
    } catch (error) {
        console.error("Error in processWithNewAI:", error);
        return {
            content: `I'm sorry, I encountered an error while processing your request: "${message}". Please try again or contact support if the issue persists.`,
            actions: [],
            data: {},
            suggestions: ["Try rephrasing your request", "Check if your training plan is up to date"]
        };
    }
}

// Helper function to generate flexible AI requests using function calling
export async function generateFlexibleRequest(message: string): Promise<NewAIRequest> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const functions = [
        {
            name: "create_flexible_request",
            description: "Convert a natural language request into a structured, flexible schema for processing",
            parameters: {
                type: "object",
                required: ["intent", "context"],
                properties: {
                    intent: {
                        type: "string",
                        description: "Primary intent of the user's request (e.g., 'explain_workout', 'modify_plan', 'fatigue_management', 'training_advice')"
                    },
                    context: {
                        type: "object",
                        description: "Relevant context for the request",
                        properties: {
                            temporal: {
                                type: "string",
                                enum: ["today", "yesterday", "this_week", "future", "past"],
                                description: "Temporal context of the request"
                            },
                            physical: {
                                type: "string",
                                enum: ["tired", "sore", "energized", "normal", "injured"],
                                description: "User's physical state"
                            },
                            mental: {
                                type: "string",
                                enum: ["motivated", "unmotivated", "stressed", "focused", "confused"],
                                description: "User's mental state"
                            },
                            training: {
                                type: "string",
                                enum: ["base", "build", "peak", "recovery", "taper"],
                                description: "Current training phase"
                            }
                        }
                    },
                    dataNeeded: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["today_workout", "recent_training_load", "user_preferences", "training_history", "recovery_patterns"]
                        },
                        description: "Types of data needed to process this request"
                    },
                    actions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    description: "Type of action to take (e.g., 'adjust_workout_intensity', 'skip_workout', 'add_recovery')"
                                },
                                parameters: {
                                    type: "object",
                                    description: "Parameters for the action",
                                    properties: {
                                        intensity: {
                                            type: "string",
                                            enum: ["easier", "harder", "skip", "moderate"],
                                            description: "Intensity adjustment for workouts"
                                        },
                                        date: {
                                            type: "string",
                                            description: "Specific date for the action (YYYY-MM-DD format)"
                                        },
                                        dayOfWeek: {
                                            type: "string",
                                            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                                            description: "Day of the week for the action"
                                        },
                                        distance: {
                                            type: "number",
                                            description: "Distance adjustment for workouts"
                                        },
                                        duration: {
                                            type: "number",
                                            description: "Duration adjustment for workouts"
                                        }
                                    }
                                },
                                reasoning: {
                                    type: "string",
                                    description: "Why this action is needed"
                                },
                                confidence: {
                                    type: "number",
                                    minimum: 0,
                                    maximum: 1,
                                    description: "Confidence level in this action (0-1)"
                                }
                            },
                            required: ["type", "reasoning", "confidence"]
                        },
                        description: "Actions to take based on the request"
                    },
                    response: {
                        type: "object",
                        properties: {
                            tone: {
                                type: "string",
                                enum: ["encouraging", "educational", "supportive"],
                                description: "Tone for the response"
                            },
                            includeTips: {
                                type: "boolean",
                                description: "Whether to include actionable tips"
                            },
                            includeRecovery: {
                                type: "boolean",
                                description: "Whether to include recovery advice"
                            },
                            sections: {
                                type: "array",
                                items: {
                                    type: "string",
                                    enum: ["acknowledgment", "explanation", "modification", "reasoning", "encouragement", "tips", "recovery"]
                                },
                                description: "Sections to include in the response"
                            }
                        }
                    }
                }
            }
        }
    ];
    
    const systemPrompt = `You are an AI assistant that converts natural language requests into structured, flexible schemas.

Your job is to analyze user messages and create a structured request that captures:
1. The user's intent (what they want to accomplish)
2. Relevant context (their current state, timing, etc.)
3. What data is needed to fulfill the request
4. What actions should be taken
5. How to respond (tone, content, etc.)

Be flexible and capture the nuances of the user's request. Consider:
- Training context (base building, peak training, recovery)
- User's physical and mental state
- Temporal context (today, this week, etc.)
- Specific needs (explanation, modification, advice)

IMPORTANT: When users mention specific days (e.g., "Tuesday's workout", "reduce Monday's intensity"), 
make sure to include the dayOfWeek parameter in the action parameters AND include "today_workout" in dataNeeded
so we can retrieve the specific workout details for that day.

Examples:
- "I'm tired from yesterday's run" → fatigue_management intent, tired physical state, today temporal
- "Explain today's workout" → explain_workout intent, today temporal, dataNeeded: ["today_workout"]
- "What is LT1 training?" → training_advice intent, educational tone
- "Move my long run to Saturday" → modify_plan intent, future temporal
- "Reduce Tuesday's workout intensity" → modify_plan intent, actions with dayOfWeek: "tuesday", dataNeeded: ["today_workout"]`;

    const userPrompt = `Convert this user message into a structured request:
"${message}"

Analyze the user's intent and create a comprehensive structured request that captures all relevant context and needed actions.
If the user mentions a specific day of the week, make sure to include it in the action parameters AND include "today_workout" in dataNeeded.`;

    try {
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            functions,
            function_call: { name: 'create_flexible_request' },
            temperature: 0.7,
            max_tokens: 1000
        });
        
        const functionCall = chatResponse.choices[0].message.function_call;
        if (!functionCall) {
            throw new Error("No function call in response");
        }
        
        const parsed = JSON.parse(functionCall.arguments || "{}");
        
        // If a specific day is mentioned in actions, ensure we include today_workout in dataNeeded
        if (parsed.actions && parsed.actions.length > 0) {
            const hasDaySpecificAction = parsed.actions.some((action: { parameters?: { dayOfWeek?: string; date?: string } }) => 
                action.parameters && (action.parameters.dayOfWeek || action.parameters.date)
            );
            
            if (hasDaySpecificAction && (!parsed.dataNeeded || !parsed.dataNeeded.includes("today_workout"))) {
                if (!parsed.dataNeeded) {
                    parsed.dataNeeded = [];
                }
                parsed.dataNeeded.push("today_workout");
            }
        }
        
        return {
            ...parsed,
            originalMessage: message // Add original message to the request
        } as NewAIRequest;
    } catch (error) {
        console.error("Error generating flexible request:", error);
        // Return a default request
        return {
            intent: "unknown",
            context: {},
            dataNeeded: [],
            actions: [],
            response: {
                tone: "supportive",
                includeTips: false,
                includeRecovery: false,
                sections: []
            }
        };
    }
}

// Helper function to process individual actions
async function processAction(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction | null> {
    try {
        console.log(`Processing action: ${action.type}`);
        
        switch (action.type) {
            case 'adjust_workout_intensity':
                return await processAdjustWorkoutIntensity(action, data);
            case 'skip_workout':
                return await processSkipWorkout(action, data);
            case 'add_recovery':
                return await processAddRecovery(action, data);
            case 'explain_workout':
                return await processExplainWorkout(action, data);
            case 'provide_training_advice':
                return await processTrainingAdvice(action, data);
            default:
                console.log(`Unknown action type: ${action.type}`);
                return action;
        }
    } catch (error) {
        console.error(`Error processing action ${action.type}:`, error);
        return {
            ...action,
            result: { error: error instanceof Error ? error.message : "Unknown error" }
        };
    }
}

// Action processing functions
async function processAdjustWorkoutIntensity(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction> {
    const todayWorkout = data.today_workout as { found?: boolean; workout?: Record<string, unknown> };
    if (!todayWorkout || !todayWorkout.found) {
        return {
            ...action,
            result: { error: "No workout found for today" }
        };
    }
    
    const intensity = action.parameters.intensity as string;
    const adjustedWorkout = adjustWorkoutIntensity(todayWorkout.workout as Record<string, unknown>, intensity);
    
    return {
        ...action,
        result: {
            originalWorkout: todayWorkout.workout,
            adjustedWorkout: adjustedWorkout,
            intensity: intensity
        }
    };
}

async function processSkipWorkout(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction> {
    const todayWorkout = data.today_workout as { found?: boolean; workout?: Record<string, unknown> };
    if (!todayWorkout || !todayWorkout.found) {
        return {
            ...action,
            result: { error: "No workout found for today" }
        };
    }
    
    const skippedWorkout = {
        ...todayWorkout.workout,
        distance: 0,
        duration: 0,
        tags: "Easy",
        name: "Rest Day",
        notes: `${(todayWorkout.workout?.notes as string) || ""} (Skipped due to user feedback)`
    };
    
    return {
        ...action,
        result: {
            originalWorkout: todayWorkout.workout,
            skippedWorkout: skippedWorkout
        }
    };
}

async function processAddRecovery(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction> {
    const todayWorkout = data.today_workout as { found?: boolean; workout?: Record<string, unknown> };
    if (!todayWorkout || !todayWorkout.found) {
        return {
            ...action,
            result: { error: "No workout found for today" }
        };
    }
    
    const workout = todayWorkout.workout as Record<string, unknown>;
    const recoveryWorkout = {
        ...workout,
        distance: Math.round((workout.distance as number || 0) * 0.7 * 10) / 10,
        tags: "Easy",
        notes: `${(workout.notes as string) || ""} (Modified for recovery)`
    };
    
    return {
        ...action,
        result: {
            originalWorkout: todayWorkout.workout,
            recoveryWorkout: recoveryWorkout
        }
    };
}

async function processExplainWorkout(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction> {
    const todayWorkout = data.today_workout as { found?: boolean; workout?: Record<string, unknown> };
    if (!todayWorkout || !todayWorkout.found) {
        return {
            ...action,
            result: { error: "No workout found for today" }
        };
    }
    
    return {
        ...action,
        result: {
            workout: todayWorkout.workout,
            explanation: "Workout explanation will be generated in the AI response"
        }
    };
}

async function processTrainingAdvice(action: NewAIAction, data: Record<string, unknown>): Promise<NewAIAction> {
    return {
        ...action,
        result: {
            advice: "Training advice will be generated in the AI response",
            context: data
        }
    };
}

// Helper function to adjust workout intensity
function adjustWorkoutIntensity(workout: Record<string, unknown>, intensity: string): Record<string, unknown> {
    const adjusted = { ...workout };
    
    switch (intensity) {
        case "easier":
            adjusted.distance = Math.round((adjusted.distance as number || 0) * 0.7 * 10) / 10;
            adjusted.tags = "Easy";
            adjusted.notes = `${(adjusted.notes as string) || ""} (Modified for recovery - reduced intensity and distance)`;
            break;
        case "harder":
            adjusted.distance = Math.round((adjusted.distance as number || 0) * 1.1 * 10) / 10;
            if (adjusted.tags === "Easy") {
                adjusted.tags = "LT1";
            }
            adjusted.notes = `${(adjusted.notes as string) || ""} (Modified - increased intensity based on feeling great)`;
            break;
        case "skip":
            adjusted.distance = 0;
            adjusted.duration = 0;
            adjusted.tags = "Easy";
            adjusted.name = "Rest Day";
            adjusted.notes = `${(adjusted.notes as string) || ""} (Skipped due to feedback - rest day recommended)`;
            break;
        case "moderate":
            adjusted.distance = Math.round((adjusted.distance as number || 0) * 0.85 * 10) / 10;
            adjusted.notes = `${(adjusted.notes as string) || ""} (Modified - moderate adjustment based on feedback)`;
            break;
    }
    
    return adjusted;
}

// AI response generation
async function generateAIResponse(request: NewAIRequest, data: Record<string, unknown>, processedActions: NewAIAction[]): Promise<string> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const systemPrompt = buildSystemPrompt(request);
    const userPrompt = buildUserPrompt(request, data, processedActions);
    
    try {
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });
        
        return chatResponse.choices[0].message.content || "I'm sorry, I couldn't generate a response at the moment.";
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I'm having trouble generating a response right now. Please try again.";
    }
}

// Build system prompt for AI
function buildSystemPrompt(request: NewAIRequest): string {
    const tone = request.response?.tone || "supportive";
    const includeTips = request.response?.includeTips || false;
    const includeRecovery = request.response?.includeRecovery || false;
    
    return `You are an expert running coach and exercise physiologist with deep knowledge of training science. You help runners understand their training plans and make informed decisions about their training.

Key principles:
1. Be conversational and engaging
2. Provide evidence-based advice
3. Consider the user's context and training phase
4. Explain the reasoning behind recommendations
5. Be encouraging and supportive
6. Use clear, accessible language

Response structure guidelines:
- Acknowledge the user's situation
- Provide relevant explanations
- Explain any modifications made
- Offer actionable tips when appropriate
- Include encouragement and support

Tone: ${tone}
Include tips: ${includeTips}
Include recovery advice: ${includeRecovery}

When explaining workouts:
- Explain the purpose and physiological benefits
- Break down the components (warmup, main workout, cooldown)
- Provide execution tips and common mistakes to avoid
- Connect it to their overall training progression

When providing training advice:
- Start with the physiological basis
- Explain why it matters for performance
- Provide practical applications and examples
- Address common misconceptions

Always be encouraging, supportive, and scientifically accurate while making complex concepts accessible to runners of all levels.`;
}

// Build user prompt for AI
function buildUserPrompt(request: NewAIRequest, data: Record<string, unknown>, processedActions: NewAIAction[]): string {
    const context = request.context;
    const intent = request.intent;
    const originalMessage = request.originalMessage || "User request";
    
    const prompt = `User Request: "${originalMessage}"

Intent: ${intent}
User Context: ${JSON.stringify(context, null, 2)}

Retrieved Data:
${formatDataForPrompt(data)}

Processed Actions:
${formatActionsForPrompt(processedActions)}

Response Requirements:
- Tone: ${request.response?.tone || "supportive"}
- Include tips: ${request.response?.includeTips || false}
- Include recovery advice: ${request.response?.includeRecovery || false}
- Sections to include: ${request.response?.sections?.join(', ') || 'all'}

Please provide a natural, conversational response that addresses the user's request. Consider their context, the data available, and any actions that were taken. Make your response educational, supportive, and actionable.`;

    return prompt;
}

// Format data for AI prompt
function formatDataForPrompt(data: Record<string, unknown>): string {
    const formatted: string[] = [];
    
    if (data.today_workout) {
        const workoutData = data.today_workout as Record<string, unknown>;
        if (workoutData.found && workoutData.workout) {
            const workout = workoutData.workout as Record<string, unknown>;
            formatted.push(`Today's Workout: ${workout.name || 'Unknown'} - ${workout.distance || 0} miles, ${workout.duration || 0} minutes, ${workout.tags || 'No tags'}`);
            if (workout.notes) {
                formatted.push(`Workout Notes: ${workout.notes}`);
            }
        } else {
            formatted.push(`Today's Workout: ${workoutData.message || 'No workout found'}`);
        }
    }
    
    if (data.recent_training_load) {
        const loadData = data.recent_training_load as Record<string, unknown>;
        formatted.push(`Recent Training Load: ${loadData.totalDistance || 0} miles, ${loadData.totalDuration || 0} minutes over ${loadData.days || 7} days`);
    }
    
    if (data.user_preferences) {
        const prefs = data.user_preferences as Record<string, unknown>;
        formatted.push(`User Preferences: Experience level: ${prefs.experience || 'Unknown'}, Goals: ${prefs.goals || 'Not specified'}`);
    }
    
    if (data.training_history) {
        const history = data.training_history as Record<string, unknown>;
        formatted.push(`Training History: ${history.totalWorkouts || 0} workouts in the last ${history.days || 30} days`);
    }
    
    if (data.recovery_patterns) {
        const patterns = data.recovery_patterns as Record<string, unknown>;
        formatted.push(`Recovery Patterns: Recovery rate: ${patterns.recoveryRate || 0}%, Hard workout rate: ${patterns.hardWorkoutRate || 0}%`);
    }
    
    return formatted.join('\n\n') || 'No data available';
}

// Format actions for AI prompt
function formatActionsForPrompt(actions: NewAIAction[]): string {
    if (actions.length === 0) {
        return "No actions were taken.";
    }
    
    const formatted: string[] = [];
    
    for (const action of actions) {
        formatted.push(`- ${action.type}: ${action.reasoning}`);
        if (action.parameters) {
            formatted.push(`  Parameters: ${JSON.stringify(action.parameters, null, 2)}`);
        }
        if (action.result) {
            formatted.push(`  Result: ${JSON.stringify(action.result, null, 2)}`);
        }
    }
    
    return formatted.join('\n');
}

// Generate suggestions
async function generateSuggestions(request: NewAIRequest, data: Record<string, unknown>): Promise<string[]> {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const systemPrompt = `You are an expert running coach providing suggestions. Based on the user's request and available data, provide 2-3 relevant suggestions that could help them with their training. Be specific and actionable.

IMPORTANT: Return ONLY a valid JSON array of strings. Do not include any other text, markdown, or formatting.`;

    const userPrompt = `User request: "${request.originalMessage || 'User request'}"
Available data: ${JSON.stringify(data, null, 2)}

Provide 2-3 specific, actionable suggestions that could help this runner. Return them as a JSON array of strings ONLY.

Example format:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

    try {
        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 300
        });
        
        const response = chatResponse.choices[0].message.content || "[]";
        console.log("Raw suggestions response:", response);
        
        try {
            // Try to parse as JSON first
            const suggestions = JSON.parse(response);
            if (Array.isArray(suggestions)) {
                return suggestions.filter((s: unknown) => typeof s === 'string');
            }
        } catch {
            console.log("JSON parsing failed, trying to extract suggestions from text");
        }
        
        // If JSON parsing fails, try to extract suggestions from text
        const lines = response.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^[-*•]\s*/, '').trim()) // Remove bullet points
            .filter(line => line.length > 0);
        
        return lines.slice(0, 3); // Return first 3 lines as suggestions
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return ["Try rephrasing your request", "Check your training plan", "Consider adjusting your training intensity"];
    }
}

// ============================================================================
// PSEUDOCODE FOR DATA RETRIEVAL AND RESPONSE GENERATION
// ============================================================================

export async function retrieveData(dataNeeded: string[], userId: string, planId: string, actions?: NewAIAction[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    
    console.log("=== RETRIEVING DATA ===");
    console.log("Data needed:", dataNeeded);
    console.log("Actions:", actions ? JSON.stringify(actions, null, 2) : "None");
    
    for (const dataType of dataNeeded) {
        console.log(`Retrieving ${dataType}...`);
        
        switch (dataType) {
            case "today_workout":
                // Check if we need a specific date from actions
                let targetDate = new Date();
                
                if (actions && actions.length > 0) {
                    for (const action of actions) {
                        if (action.parameters) {
                            if (action.parameters.dayOfWeek) {
                                const dayOfWeek = action.parameters.dayOfWeek as string;
                                targetDate = getNextDayOfWeek(dayOfWeek);
                                console.log(`Found dayOfWeek parameter: ${dayOfWeek}, targeting date: ${targetDate.toDateString()}`);
                                break;
                            } else if (action.parameters.date) {
                                targetDate = new Date(action.parameters.date as string);
                                console.log(`Found date parameter: ${action.parameters.date}, targeting date: ${targetDate.toDateString()}`);
                                break;
                            }
                        }
                    }
                }
                
                result.today_workout = await getWorkoutForDate(targetDate, userId, planId);
                console.log("Workout for target date:", JSON.stringify(result.today_workout, null, 2));
                break;
            case "recent_training_load":
                result.recent_training_load = await getTrainingLoad(userId, 7);
                console.log("Recent training load:", JSON.stringify(result.recent_training_load, null, 2));
                break;
            case "user_preferences":
                result.user_preferences = await getUserPreferences(userId);
                console.log("User preferences:", JSON.stringify(result.user_preferences, null, 2));
                break;
            case "training_history":
                result.training_history = await getTrainingHistory(userId, 30);
                console.log("Training history:", JSON.stringify(result.training_history, null, 2));
                break;
            case "recovery_patterns":
                result.recovery_patterns = await analyzeRecoveryPatterns(userId, 30);
                console.log("Recovery patterns:", JSON.stringify(result.recovery_patterns, null, 2));
                break;
        }
    }
    
    console.log("=== DATA RETRIEVAL COMPLETE ===");
    console.log("Retrieved data keys:", Object.keys(result));
    
    return result;
}

export async function getWorkoutForDate(date: Date, userId: string, planId: string): Promise<Record<string, unknown>> {
    try {
        console.log(`=== GETTING WORKOUT FOR DATE ===`);
        console.log(`Target date: ${date.toDateString()}`);
        console.log(`User ID: ${userId}`);
        console.log(`Plan ID: ${planId}`);
        
        // If planId is 'current-plan' or 'default', we need to fetch all week documents
        if (planId === 'current-plan' || planId === 'default') {
            console.log("Fetching all week documents for current plan...");
            // Fetch all week documents for this user
            const plansRef = collection(db, "users", userId, "plans");
            const plansQuery = query(plansRef, orderBy('week', 'asc'));
            const querySnapshot = await getDocs(plansQuery);
            
            if (querySnapshot.empty) {
                console.log("No plans found for user");
                return {
                    workout: null,
                    found: false,
                    message: "No plans found for user"
                };
            }
            
            console.log(`Found ${querySnapshot.docs.length} week documents`);
            
            // Search through all weeks to find workouts for the target date
            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                const workouts = data.workouts || [];
                
                console.log(`Checking week ${data.week} with ${workouts.length} workouts`);
                
                for (const workout of workouts) {
                    const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                    
                    console.log(`  Checking workout: ${workout.name} on ${workoutDate.toDateString()}`);
                    
                    // Check if workout is on the target date (same day)
                    if (workoutDate.toDateString() === date.toDateString()) {
                        console.log(`  ✓ Found matching workout: ${workout.name}`);
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
            console.log("Fetching specific plan document...");
            // Try to fetch a specific plan document
            const planRef = doc(db, "users", userId, "plans", planId);
            const planSnap = await getDoc(planRef);
            
            if (!planSnap.exists()) {
                console.log("Plan document not found");
                return {
                    workout: null,
                    found: false,
                    message: "Plan not found"
                };
            }
            
            const data = planSnap.data();
            const workouts = data.workouts || [];
            
            console.log(`Plan document found with ${workouts.length} workouts`);
            
            for (const workout of workouts) {
                const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                
                console.log(`  Checking workout: ${workout.name} on ${workoutDate.toDateString()}`);
                
                // Check if workout is on the target date (same day)
                if (workoutDate.toDateString() === date.toDateString()) {
                    console.log(`  ✓ Found matching workout: ${workout.name}`);
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
        
        // No workout found for the date
        console.log(`❌ No workout found for ${date.toDateString()}`);
        return {
            workout: null,
            found: false,
            message: `No workout found for ${date.toDateString()}`
        };
        
    } catch (error) {
        console.error("Error getting workout for date:", error);
        return {
            workout: null,
            found: false,
            message: `Error retrieving workout: ${error}`
        };
    }
}

export async function getTrainingLoad(userId: string, days: number): Promise<Record<string, unknown>> {
    try {
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

export async function getUserPreferences(userId: string): Promise<Record<string, unknown>> {
    try {
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

export async function getTrainingHistory(userId: string, days: number): Promise<Record<string, unknown>> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const plansRef = collection(db, "users", userId, "plans");
        const plansQuery = query(plansRef, orderBy('week', 'asc'));
        const querySnapshot = await getDocs(plansQuery);
        
        const history: Array<Record<string, unknown>> = [];
        
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const workouts = data.workouts || [];
            
            for (const workout of workouts) {
                const workoutDate = workout.date?.toDate?.() || new Date(workout.date);
                
                if (workoutDate >= startDate && workoutDate <= endDate) {
                    history.push({
                        date: workoutDate,
                        name: workout.name,
                        distance: workout.distance,
                        duration: workout.duration,
                        tags: workout.tags,
                        week: data.week
                    });
                }
            }
        }
        
        return {
            workouts: history,
            totalWorkouts: history.length,
            averageDistance: history.length > 0 ? history.reduce((sum, w) => sum + (w.distance as number || 0), 0) / history.length : 0,
            averageDuration: history.length > 0 ? history.reduce((sum, w) => sum + (w.duration as number || 0), 0) / history.length : 0
        };
    } catch (error) {
        console.error("Error retrieving training history:", error);
        return {
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

export async function analyzeRecoveryPatterns(userId: string, days: number): Promise<Record<string, unknown>> {
    try {
        const trainingHistory = await getTrainingHistory(userId, days);
        
        if ('error' in trainingHistory) {
            return trainingHistory;
        }
        
        const workouts = trainingHistory.workouts as Array<Record<string, unknown>>;
        let recoveryDays = 0;
        let hardWorkouts = 0;
        let consecutiveHardDays = 0;
        let maxConsecutiveHardDays = 0;
        
        for (let i = 0; i < workouts.length; i++) {
            const workout = workouts[i];
            const tags = workout.tags as string;
            const distance = workout.distance as number;
            
            if (tags === 'Easy' || distance === 0) {
                recoveryDays++;
                consecutiveHardDays = 0;
            } else if (tags === 'LT2' || tags === 'VO2Max' || distance > 8) {
                hardWorkouts++;
                consecutiveHardDays++;
                maxConsecutiveHardDays = Math.max(maxConsecutiveHardDays, consecutiveHardDays);
            } else {
                consecutiveHardDays = 0;
            }
        }
        
        const recoveryRate = workouts.length > 0 ? recoveryDays / workouts.length : 0;
        const hardWorkoutRate = workouts.length > 0 ? hardWorkouts / workouts.length : 0;
        
        let recoveryAssessment = 'optimal';
        if (recoveryRate < 0.2) {
            recoveryAssessment = 'insufficient';
        } else if (recoveryRate > 0.5) {
            recoveryAssessment = 'excessive';
        }
        
        return {
            recoveryDays,
            hardWorkouts,
            recoveryRate,
            hardWorkoutRate,
            maxConsecutiveHardDays,
            recoveryAssessment,
            recommendations: generateRecoveryRecommendations(recoveryRate, hardWorkoutRate, maxConsecutiveHardDays)
        };
    } catch (error) {
        console.error("Error analyzing recovery patterns:", error);
        return {
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

function generateRecoveryRecommendations(recoveryRate: number, hardWorkoutRate: number, maxConsecutiveHardDays: number): string[] {
    const recommendations: string[] = [];
    
    if (recoveryRate < 0.2) {
        recommendations.push("Consider adding more recovery days to your training schedule");
    }
    
    if (hardWorkoutRate > 0.4) {
        recommendations.push("You may be doing too many hard workouts - consider reducing intensity");
    }
    
    if (maxConsecutiveHardDays > 3) {
        recommendations.push("Avoid more than 3 consecutive hard training days");
    }
    
    if (recommendations.length === 0) {
        recommendations.push("Your recovery patterns look good - keep it up!");
    }
    
    return recommendations;
}

// Helper function to get current plan data
async function getCurrentPlan(userId: string, planId: string): Promise<TrainingWeek[]> {
    try {
        console.log("=== GETTING CURRENT PLAN ===");
        console.log(`User ID: ${userId}`);
        console.log(`Plan ID: ${planId}`);
        
        if (planId === 'current-plan' || planId === 'default') {
            console.log("Fetching all week documents for current plan...");
            const plansRef = collection(db, "users", userId, "plans");
            const plansQuery = query(plansRef, orderBy('week', 'asc'));
            const querySnapshot = await getDocs(plansQuery);
            
            console.log(`Found ${querySnapshot.docs.length} week documents`);
            
            const weeks: TrainingWeek[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`Processing week ${data.week} with ${data.workouts?.length || 0} workouts`);
                
                const week: TrainingWeek = {
                    id: doc.id,
                    week: data.week,
                    startDate: data.startDate?.toDate?.() || new Date(data.startDate),
                    endDate: data.endDate?.toDate?.() || new Date(data.endDate),
                    totalMileage: data.totalMileage || 0,
                    totalDuration: data.totalDuration || 0,
                    description: data.description || '',
                    workouts: data.workouts?.map((w: Record<string, unknown>) => ({
                        ...w,
                        date: typeof w.date === 'object' && w.date !== null && 'toDate' in w.date 
                            ? (w.date as { toDate(): Date }).toDate() 
                            : new Date(w.date as string)
                    })) || []
                };
                weeks.push(week);
                
                // Log workout details for this week
                week.workouts.forEach((workout, index) => {
                    console.log(`  Workout ${index}: ${workout.name} on ${workout.date.toDateString()} (${workout.distance} miles, ${workout.tags})`);
                });
            });
            
            console.log(`Returning ${weeks.length} weeks with total ${weeks.reduce((sum, w) => sum + w.workouts.length, 0)} workouts`);
            return weeks;
        } else {
            console.log("Fetching specific plan document...");
            const planRef = doc(db, "users", userId, "plans", planId);
            const planSnap = await getDoc(planRef);
            
            if (!planSnap.exists()) {
                console.log("Plan document not found");
                return [];
            }
            
            const data = planSnap.data();
            console.log(`Plan document found with data:`, JSON.stringify(data, null, 2));
            
            if (data.week) {
                // Single week document
                console.log("Processing single week document");
                const week: TrainingWeek = {
                    id: planSnap.id,
                    week: data.week,
                    startDate: data.startDate?.toDate?.() || new Date(data.startDate),
                    endDate: data.endDate?.toDate?.() || new Date(data.endDate),
                    totalMileage: data.totalMileage || 0,
                    totalDuration: data.totalDuration || 0,
                    description: data.description || '',
                    workouts: data.workouts?.map((w: Record<string, unknown>) => ({
                        ...w,
                        date: typeof w.date === 'object' && w.date !== null && 'toDate' in w.date 
                            ? (w.date as { toDate(): Date }).toDate() 
                            : new Date(w.date as string)
                    })) || []
                };
                
                console.log(`Single week with ${week.workouts.length} workouts`);
                week.workouts.forEach((workout, index) => {
                    console.log(`  Workout ${index}: ${workout.name} on ${workout.date.toDateString()} (${workout.distance} miles, ${workout.tags})`);
                });
                
                return [week];
            } else {
                // Multi-week document
                console.log("Processing multi-week document");
                const weeks = data.weeks || [];
                console.log(`Multi-week document with ${weeks.length} weeks`);
                return weeks;
            }
        }
    } catch (error) {
        console.error("Error getting current plan:", error);
        return [];
    }
}

// Helper function to apply modifications to the plan and save to Firestore
async function applyModificationsToPlan(
    currentWeeks: TrainingWeek[], 
    action: NewAIAction, 
    userId: string, 
    planId: string
): Promise<TrainingWeek[]> {
    try {
        console.log("=== APPLYING MODIFICATIONS TO PLAN ===");
        console.log("Current weeks structure:", JSON.stringify(currentWeeks.map(w => ({ id: w.id, week: w.week, workoutCount: w.workouts.length })), null, 2));
        
        const updatedWeeks = [...currentWeeks];
        
        // Determine target date - check if action has a specific date parameter
        let targetDate: Date;
        if (action.parameters.date) {
            // If a specific date is provided in the action
            targetDate = new Date(action.parameters.date as string);
            console.log(`Looking for workout on specific date: ${targetDate.toDateString()}`);
        } else if (action.parameters.dayOfWeek) {
            // If a day of week is provided (e.g., "tuesday")
            const dayOfWeek = (action.parameters.dayOfWeek as string).toLowerCase();
            targetDate = getNextDayOfWeek(dayOfWeek);
            console.log(`Looking for workout on ${dayOfWeek} (${targetDate.toDateString()})`);
        } else {
            // Default to today
            targetDate = new Date();
            console.log(`Looking for workout on today: ${targetDate.toDateString()}`);
        }
        
        // Find the week containing the target workout
        let targetWeekIndex = -1;
        let targetWorkoutIndex = -1;
        
        console.log("Searching through weeks for target date...");
        
        for (let weekIndex = 0; weekIndex < updatedWeeks.length; weekIndex++) {
            const week = updatedWeeks[weekIndex];
            console.log(`Checking week ${week.week} (${week.workouts.length} workouts)`);
            
            for (let workoutIndex = 0; workoutIndex < week.workouts.length; workoutIndex++) {
                const workout = week.workouts[workoutIndex];
                const workoutDate = workout.date instanceof Date ? workout.date : new Date(workout.date);
                
                console.log(`  Workout ${workoutIndex}: ${workout.name} on ${workoutDate.toDateString()}`);
                
                if (workoutDate.toDateString() === targetDate.toDateString()) {
                    targetWeekIndex = weekIndex;
                    targetWorkoutIndex = workoutIndex;
                    console.log(`  ✓ Found target workout: ${workout.name} in week ${week.week}`);
                    break;
                }
            }
            if (targetWeekIndex !== -1) break;
        }
        
        if (targetWeekIndex === -1 || targetWorkoutIndex === -1) {
            console.log(`❌ No workout found for ${targetDate.toDateString()}, skipping modification`);
            return updatedWeeks;
        }
        
        // Apply the modification based on action type
        const targetWorkout = updatedWeeks[targetWeekIndex].workouts[targetWorkoutIndex];
        console.log("Original workout:", JSON.stringify(targetWorkout, null, 2));
        
        switch (action.type) {
            case 'adjust_workout_intensity':
                const intensity = action.parameters.intensity as string;
                console.log(`Adjusting workout intensity to: ${intensity}`);
                const adjustedWorkout = adjustWorkoutIntensity(targetWorkout, intensity);
                updatedWeeks[targetWeekIndex].workouts[targetWorkoutIndex] = adjustedWorkout as TrainingWorkout;
                console.log("Adjusted workout:", JSON.stringify(adjustedWorkout, null, 2));
                break;
                
            case 'skip_workout':
                console.log("Skipping workout");
                const skippedWorkout: TrainingWorkout = {
                    ...targetWorkout,
                    distance: 0,
                    duration: 0,
                    tags: "Easy",
                    name: "Rest Day",
                    notes: `${targetWorkout.notes || ""} (Skipped due to user feedback)`
                };
                updatedWeeks[targetWeekIndex].workouts[targetWorkoutIndex] = skippedWorkout;
                console.log("Skipped workout:", JSON.stringify(skippedWorkout, null, 2));
                break;
                
            case 'add_recovery':
                console.log("Adding recovery elements");
                const recoveryWorkout: TrainingWorkout = {
                    ...targetWorkout,
                    distance: Math.round((targetWorkout.distance || 0) * 0.7 * 10) / 10,
                    tags: "Easy",
                    name: targetWorkout.name,
                    notes: `${targetWorkout.notes || ""} (Modified for recovery)`
                };
                updatedWeeks[targetWeekIndex].workouts[targetWorkoutIndex] = recoveryWorkout;
                console.log("Recovery workout:", JSON.stringify(recoveryWorkout, null, 2));
                break;
        }
        
        console.log("=== SAVING TO FIRESTORE ===");
        console.log("Updated weeks structure:", JSON.stringify(updatedWeeks.map(w => ({ id: w.id, week: w.week, workoutCount: w.workouts.length })), null, 2));
        
        // Save the updated plan to Firestore
        await saveUpdatedPlan(userId, planId, updatedWeeks);
        
        return updatedWeeks;
        
    } catch (error) {
        console.error("Error applying modifications to plan:", error);
        return currentWeeks;
    }
}

// Helper function to get the next occurrence of a day of the week
function getNextDayOfWeek(dayOfWeek: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(dayOfWeek);
    
    if (targetDayIndex === -1) {
        console.log(`Invalid day of week: ${dayOfWeek}, defaulting to today`);
        return new Date();
    }
    
    const today = new Date();
    const currentDayIndex = today.getDay();
    const daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate;
}

// Helper function to save updated plan to Firestore
async function saveUpdatedPlan(userId: string, planId: string, updatedWeeks: TrainingWeek[]): Promise<void> {
    try {
        console.log(`=== SAVING TO FIRESTORE ===`);
        console.log(`User ID: ${userId}`);
        console.log(`Plan ID: ${planId}`);
        console.log(`Number of weeks: ${updatedWeeks.length}`);
        
        // Log the full updated weeks data being sent to Firestore
        console.log("Full updated weeks data being sent to Firestore:");
        console.log(JSON.stringify(updatedWeeks, null, 2));
        
        // Use the existing firestoreRepo to save the plan
        await firestoreRepo.savePlan(
            userId,
            planId,
            updatedWeeks,
            0, // version - will be incremented by firestoreRepo
            {
                atISO: new Date().toISOString(),
                actor: "NEW_AI_SYSTEM",
                operations: [],
                changeset: [],
                warnings: []
            }
        );
        
        console.log("✅ Successfully saved updated plan to Firestore");
        
    } catch (error) {
        console.error("❌ Error saving updated plan to Firestore:", error);
        throw error;
    }
}

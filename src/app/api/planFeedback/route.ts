import { NextRequest, NextResponse } from "next/server";
import { classifyOperation } from "@/lib/feedback-loop/classifyOperation";
import { applyPlanOps } from "@/lib/feedback-loop/applyPlanOps";
import { firestoreRepo } from "@/lib/feedback-loop/firestoreRepo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrainingWeek } from "@/lib/types";
import { OpenAI } from "openai";
import { processWithNewAI } from "@/lib/feedback-loop/newAISystem";

// Feature flag to switch between old and new systems
const USE_NEW_AI_SYSTEM = true;

async function processWithOldAI(message: string, userId: string, planId: string): Promise<NextResponse> {
  // Current implementation
  try {
    console.log("=== Starting planFeedback request (OLD SYSTEM) ===");
    const { message: msg, planId: pid, userId: uid } = { message, planId, userId };
    console.log("Request data:", { message: msg, planId: pid, userId: uid });

    // 1) interpret → ops
    console.log("Classifying operation...");
    const operationRequest = await classifyOperation(msg);
    console.log("Operation request:", JSON.stringify(operationRequest, null, 2));
    
    // Extract user_id and plan_id from the request or use defaults
    const effectiveUserId = uid ?? operationRequest.user_id;
    const effectivePlanId = pid ?? operationRequest.plan_id;

    console.log("Effective IDs:", { effectiveUserId, effectivePlanId });

    if (!effectiveUserId || !effectivePlanId) {
      console.log("Missing user_id or plan_id");
      return NextResponse.json({ error: "Missing user_id or plan_id" }, { status: 400 });
    }

    // Get the plan
    console.log("Fetching plan...");
    const plan = await getPlanById(effectiveUserId, effectivePlanId);
    if (!plan) {
      console.log("Plan not found");
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    console.log(`Plan found with ${plan.weeks.length} weeks`);

    // 2) apply operations
    console.log("Applying operations...");
    
    // Check if this is an informational query (ExplainWorkout)
    const isInformationalQuery = operationRequest.operations.some((op: { type: string }) => op.type === 'ExplainWorkout');
    
    // Check if this is a feedback-based adjustment
    const isFeedbackAdjustment = operationRequest.operations.some((op: { type: string }) => 
      op.type === 'AdjustWorkoutIntensity' || op.type === 'ModifyWorkoutBasedOnFeedback'
    );
    
    if (isInformationalQuery) {
      // Handle informational queries differently
      const explainOp = operationRequest.operations.find((op: { type: string }) => op.type === 'ExplainWorkout');
      const response = await handleInformationalQuery(plan.weeks, explainOp);
      
      return NextResponse.json({
        planId: effectivePlanId,
        toVersion: plan.version ?? 0,
        updatedWeeks: [],
        warnings: [],
        explanation: response
      });
    }
    
    if (isFeedbackAdjustment) {
      // Handle feedback-based adjustments with enhanced AI response
      const feedbackOp = operationRequest.operations.find((op: { type: string }) => 
        op.type === 'AdjustWorkoutIntensity' || op.type === 'ModifyWorkoutBasedOnFeedback'
      );
      
      // Apply the operations first
      const res = await applyPlanOps(
        plan.weeks,
        operationRequest.operations,
        {
          userId: effectiveUserId,
          planId: effectivePlanId,
          fromVersion: plan.version ?? 0,
          nowISO: new Date().toISOString(),
          actor: "GPT",
        },
        firestoreRepo
      );
      
      // Generate a personalized response about the adjustment
      const feedbackResponse = await generateFeedbackResponse(plan.weeks, feedbackOp);
      
      return NextResponse.json({
        planId: effectivePlanId,
        toVersion: res.toVersion,
        updatedWeeks: res.updatedWeeks,
        warnings: res.warnings,
        explanation: feedbackResponse
      });
    }
    
    const res = await applyPlanOps(
      plan.weeks,
      operationRequest.operations,
      {
        userId: effectiveUserId,
        planId: effectivePlanId,
        fromVersion: plan.version ?? 0,
        nowISO: new Date().toISOString(),
        actor: "GPT",
      },
      firestoreRepo
    );

    console.log("Operations applied successfully:", { 
      toVersion: res.toVersion, 
      updatedWeeks: res.updatedWeeks.length,
      warnings: res.warnings 
    });

    return NextResponse.json({
      planId: effectivePlanId,
      toVersion: res.toVersion,
      updatedWeeks: res.updatedWeeks,
      warnings: res.warnings,
    });
  } catch (error: unknown) {
    console.error("=== Error in planFeedback (OLD SYSTEM) ===", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = /version conflict/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// Helper function to get plan by ID
async function getPlanById(userId: string, planId: string): Promise<{ weeks: TrainingWeek[]; version?: number } | null> {
  try {
    console.log(`Fetching plan for userId: ${userId}, planId: ${planId}`);
    
    // If planId is 'current-plan' or similar, we need to fetch all weeks
    if (planId === 'current-plan' || planId === 'default') {
      // Fetch all week documents for this user
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const plansRef = collection(db, "users", userId, "plans");
      const plansQuery = query(plansRef, orderBy('week', 'asc'));
      const querySnapshot = await getDocs(plansQuery);
      
      if (querySnapshot.empty) {
        console.log(`No plans found for userId: ${userId}`);
        return null;
      }
      
      const weeks: TrainingWeek[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore timestamps to Date objects
        const week: TrainingWeek = {
          id: doc.id,
          week: data.week,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
          totalMileage: data.totalMileage || 0,
          totalDuration: data.totalDuration || 0,
          description: data.description || '',
          workouts: data.workouts?.map((w: { date: unknown; [key: string]: unknown }) => ({
            ...w,
            date: typeof w.date === 'object' && w.date !== null && 'toDate' in w.date 
                ? (w.date as { toDate(): Date }).toDate() 
                : new Date(w.date as string)
          })) || []
        };
        weeks.push(week);
      });
      
      console.log(`Found ${weeks.length} weeks for user`);
      return {
        weeks,
        version: 0 // We'll use 0 for now since we're not tracking versions per week
      };
    } else {
      // Try to fetch a specific plan document
      const planRef = doc(db, "users", userId, "plans", planId);
      const planSnap = await getDoc(planRef);
      
      if (!planSnap.exists()) {
        console.log(`Plan not found for userId: ${userId}, planId: ${planId}`);
        return null;
      }
      
      const data = planSnap.data();
      // If it's a single week, wrap it in an array
      if (data.week) {
        const week: TrainingWeek = {
          id: planSnap.id,
          week: data.week,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
          totalMileage: data.totalMileage || 0,
          totalDuration: data.totalDuration || 0,
          description: data.description || '',
          workouts: data.workouts?.map((w: { date: unknown; [key: string]: unknown }) => ({
            ...w,
            date: typeof w.date === 'object' && w.date !== null && 'toDate' in w.date 
                ? (w.date as { toDate(): Date }).toDate() 
                : new Date(w.date as string)
          })) || []
        };
        return {
          weeks: [week],
          version: data.version || 0
        };
      } else {
        // If it's already a plan with weeks array
        return {
          weeks: data.weeks || [],
          version: data.version || 0
        };
      }
    }
  } catch (error) {
    console.error("Error fetching plan:", error);
    return null;
  }
}

// Helper function to handle informational queries using AI
async function handleInformationalQuery(weeks: TrainingWeek[], explainOp: { type: string; date?: string; query?: string } | undefined): Promise<string> {
  if (!explainOp) {
    return "I'm here to help! What would you like to know about your training plan?";
  }

  const { date, query } = explainOp;
  
  // If no specific date, use today's date
  const targetDate = date ? new Date(date) : new Date();
  const today = targetDate.toISOString().split('T')[0];
  
  // Find the workout for the specified date
  let targetWorkout = null;
  let targetWeek = null;
  
  for (const week of weeks) {
    const workout = week.workouts.find(w => {
      const workoutDate = w.date instanceof Date ? w.date.toISOString().split('T')[0] : new Date(w.date).toISOString().split('T')[0];
      return workoutDate === today;
    });
    
    if (workout) {
      targetWorkout = workout;
      targetWeek = week;
      break;
    }
  }
  
  // Prepare context for AI
  const context = {
    targetDate: today,
    targetWorkout,
    targetWeek,
    allWeeks: weeks,
    userQuery: query || "explain this workout"
  };
  
  // Generate AI response
  const response = await generateAIResponse(context);
  return response;
}

// New function to generate AI responses
async function generateAIResponse(context: {
  targetDate: string;
  targetWorkout: { [key: string]: unknown } | null;
  targetWeek: { week?: number; workouts?: { name: string; date: string | Date }[] } | null;
  allWeeks: TrainingWeek[];
  userQuery: string;
}): Promise<string> {
  const { targetDate, targetWorkout, targetWeek, allWeeks, userQuery } = context;
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompt = `You are an expert running coach and exercise physiologist with deep knowledge of training science. You help runners understand their training plans and explain training concepts in an engaging, educational way.

Key areas of expertise:

1. **Training Physiology & Zones**:
   - **Easy Runs**: 60-70% max heart rate, conversational pace, builds aerobic base, promotes recovery
   - **LT1 (Lactate Threshold 1)**: 70-80% max heart rate, "comfortably hard", improves fat burning and aerobic efficiency
   - **LT2 (Lactate Threshold 2)**: 80-90% max heart rate, "threshold pace", improves lactate clearance and endurance
   - **VO2Max**: 90-95% max heart rate, improves oxygen utilization and running economy
   - **Anaerobic**: 95-100% max heart rate, improves speed and power

2. **Training Principles**:
   - **Progressive Overload**: Gradually increasing training stress to drive adaptations
   - **Recovery**: Why easy days are crucial for adaptation and injury prevention
   - **Specificity**: Training should match your race goals
   - **Individualization**: Training should be tailored to your current fitness and goals

3. **Workout Types**:
   - **Long Runs**: Build endurance and mental toughness
   - **Tempo Runs**: Improve lactate threshold and race pace
   - **Intervals**: Improve VO2Max and running economy
   - **Easy Runs**: Promote recovery and build aerobic base
   - **Recovery Runs**: Active recovery and blood flow

4. **Training Concepts**:
   - **Periodization**: Structured training cycles (base, build, peak, taper)
   - **Supercompensation**: How the body adapts to training stress
   - **Overtraining**: Signs, prevention, and recovery
   - **Injury Prevention**: Proper progression, rest, and form

When explaining workouts:
- Be conversational and engaging
- Explain the physiological purpose and benefits
- Connect to overall training goals and race preparation
- Provide actionable insights and execution tips
- Use analogies and real-world examples
- Address common mistakes and how to avoid them

When explaining training concepts:
- Start with the physiological basis (why it works)
- Explain practical applications (how to use it)
- Connect to performance benefits (what you'll gain)
- Provide context for different training levels
- Use clear, accessible language

Always be encouraging, supportive, and scientifically accurate while making complex concepts accessible to runners of all levels.`;

  const userPrompt = `Context:
- Target Date: ${targetDate}
- User Query: "${userQuery}"
${targetWorkout ? `
- Target Workout: ${JSON.stringify(targetWorkout, null, 2)}
- Week: ${targetWeek?.week || 'unknown'}
` : '- No workout found for this date'}
${allWeeks.length > 0 ? `
- Total weeks in plan: ${allWeeks.length}
- Current week workouts: ${targetWeek ? targetWeek.workouts?.map((w: { name: string; date: string | Date }) => `${w.name} (${w.date})`).join(', ') || 'none' : 'none'}
` : ''}

Please provide a natural, conversational response to the user's query. 

If they're asking about a specific workout:
- Explain the workout's purpose and physiological benefits
- Break down the components (warmup, main workout, cooldown)
- Provide execution tips and common mistakes to avoid
- Connect it to their overall training progression

If they're asking about training concepts (LT1, LT2, easy runs, etc.):
- Start with the physiological basis
- Explain why it matters for performance
- Provide practical applications and examples
- Address common misconceptions

If they're asking general running advice:
- Provide evidence-based recommendations
- Consider their current training context
- Be encouraging and supportive

Always be conversational, educational, and helpful!`;

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

// New function to generate feedback-based responses
async function generateFeedbackResponse(
  weeks: TrainingWeek[], 
  feedbackOp: { type: string; date?: string; adjustment?: string; reason?: string; userFeedback?: string } | undefined
): Promise<string> {
  if (!feedbackOp) {
    return "I've processed your feedback and made adjustments to your training plan.";
  }

  const { date, adjustment, reason, userFeedback } = feedbackOp;
  const targetDate = date ? new Date(date) : new Date();
  const today = targetDate.toISOString().split('T')[0];
  
  // Find the workout that was adjusted
  let targetWorkout = null;
  let targetWeek = null;
  
  for (const week of weeks) {
    const workout = week.workouts.find(w => {
      const workoutDate = w.date instanceof Date ? w.date.toISOString().split('T')[0] : new Date(w.date).toISOString().split('T')[0];
      return workoutDate === today;
    });
    
    if (workout) {
      targetWorkout = workout;
      targetWeek = week;
      break;
    }
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompt = `You are an expert running coach who helps runners adjust their training based on how they're feeling. You provide encouraging, educational responses that explain why adjustments were made and how they benefit the runner's training.

Key principles:
1. **Recovery is crucial** - Respect when runners are tired or sore
2. **Progressive overload** - Don't make everything easy, but adjust appropriately
3. **Individualization** - Consider the runner's current state and training phase
4. **Education** - Explain the reasoning behind adjustments
5. **Encouragement** - Be supportive and positive

When explaining adjustments:
- Acknowledge the runner's feedback
- Explain why the adjustment was made
- Connect it to training principles
- Provide encouragement and next steps
- Suggest recovery strategies if needed`;

  const userPrompt = `Context:
- User Feedback: "${userFeedback || 'No specific feedback provided'}"
- Adjustment Made: ${adjustment || 'none'}
- Reason: ${reason || 'none'}
- Target Date: ${today}
${targetWorkout ? `
- Original Workout: ${targetWorkout.name} (${targetWorkout.distance} miles, ${targetWorkout.tags})
- Week: ${targetWeek?.week || 'unknown'}
` : '- No workout found for this date'}

Please provide a natural, conversational response that:
1. Acknowledges the user's feedback
2. Explains what adjustment was made and why
3. Connects it to training principles
4. Provides encouragement and next steps
5. Suggests recovery strategies if the adjustment was for fatigue/soreness

Be supportive, educational, and helpful!`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    return chatResponse.choices[0].message.content || "I've processed your feedback and made appropriate adjustments to your training plan.";
  } catch (error) {
    console.error("Error generating feedback response:", error);
    return "I've processed your feedback and made adjustments to your training plan. The changes have been applied successfully.";
  }
}

export async function POST(req: NextRequest) {
  const { message, planId, userId } = await req.json();
  
  if (USE_NEW_AI_SYSTEM) {
    try {
      const newAIResponse = await processWithNewAI(message, userId, planId);
      return NextResponse.json({
        planId,
        toVersion: 0,
        updatedWeeks: [],
        warnings: [],
        explanation: newAIResponse.content,
        suggestions: newAIResponse.suggestions
      });
    } catch (error) {
      console.error("Error in new AI system:", error);
      // Fallback to old system
      return processWithOldAI(message, userId, planId);
    }
  } else {
    return processWithOldAI(message, userId, planId);
  }
}

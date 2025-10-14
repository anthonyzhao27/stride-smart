import { NextRequest, NextResponse } from "next/server";
import { processWithNewAI } from "@/lib/feedback-loop/newAISystem";
import { requireAuth } from "@/lib/cognitoAuth";

export async function POST(req: NextRequest) {
  // Verify authentication and get user ID from token
  const payload = await requireAuth(req).catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = payload.sub;

  const { message, planId } = await req.json();
  
  try {
    const newAIResponse = await processWithNewAI(message, userId, planId);
    return NextResponse.json({
      planId,
      toVersion: 0,
      updatedWeeks: newAIResponse.updatedWeeks || [],
      warnings: [],
      explanation: newAIResponse.content,
      suggestions: newAIResponse.suggestions
    });
  } catch (error) {
    console.error("Error in AI system:", error);
    return NextResponse.json({ 
      error: "I'm sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists." 
    }, { status: 500 });
  }
}

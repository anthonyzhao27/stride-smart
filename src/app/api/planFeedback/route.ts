import { NextRequest, NextResponse } from "next/server";
import { processWithNewAI } from "@/lib/feedback-loop/newAISystem";

export async function POST(req: NextRequest) {
  const { message, planId, userId } = await req.json();
  
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

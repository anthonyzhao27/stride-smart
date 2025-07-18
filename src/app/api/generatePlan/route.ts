import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { OpenAI } from "openai";

import { NextResponse } from "next/server";

import { generatePlanPrompt } from "@/lib/ai/generatePlanPrompt";

import { postprocessPlan } from "@/lib/ai/postprocessPlan";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

export async function POST(req: Request) {
    const body = await req.json();
    const { uid, user } = body;

    const allPlans = [];

    for (let week = 1; week <= 3; week++) {
        const [messages, functions] = generatePlanPrompt(user, week);
    
        const chatResponse  = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            functions,
            function_call: { name: 'generateTrainingWeek' },
            temperature: 0.7,
            max_tokens: 10000
        });
    
        try {
            const args = chatResponse.choices[0].message?.function_call?.arguments;
            if (!args) throw new Error("No function call arguments returned.")
    
            let plan = JSON.parse(args);
            console.log('Data being sent to Firestore:', JSON.stringify(plan, null, 2));
            plan = postprocessPlan(plan, week, user);
            const planRef = doc(db, "users", uid, "plans", `week_${week}`);
            await setDoc(planRef, plan);

            allPlans.push({ week, plan})
    
        } catch (error) {
            console.error("Failed to save plan:", error);
            return NextResponse.json({ success: false, error: "Invalid plan format" }, { status: 500 })
        }
    }
    return NextResponse.json({ success: true, allPlans});
}
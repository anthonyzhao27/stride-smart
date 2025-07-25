import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { OpenAI } from "openai";

import { NextResponse } from "next/server";

import { generateKeyWorkouts } from "@/lib/training/generateKeyWorkouts";

import { postprocessPlan } from "@/lib/ai/postprocessPlan";


export async function POST(req: Request) {
    const body = await req.json();
    const { uid, user } = body;

    const allPlans = [];

    for (let week = 1; week <= 3; week++) {
        let plan = generateKeyWorkouts(user, week);
    
        try {
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
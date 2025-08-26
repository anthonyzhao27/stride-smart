import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { NextResponse } from "next/server";

import { generateCompleteWeek } from "@/lib/plan-generation/generateCompleteWeek";

// import { postprocessPlan } from "@/lib/ai/postprocessPlan";


export async function POST(req: Request) {
    const body = await req.json();
    const { uid, user } = body;

    const allPlans = [];

    for (let week = 1; week <= 1; week++) {
        const plan = await generateCompleteWeek(user, week);
    
        try {
            console.log('Data being sent to Firestore:', JSON.stringify(plan, null, 2));
            const planRef = doc(db, "users", uid, "plans", `week_${week}`);
            await setDoc(planRef, plan);

            allPlans.push({ week, plan});
    
        } catch (error) {
            console.error("Failed to save plan:", error);
            return NextResponse.json({ success: false, error: "Invalid plan format" }, { status: 500 });
        }
    }
    return NextResponse.json({ success: true, allPlans});
}
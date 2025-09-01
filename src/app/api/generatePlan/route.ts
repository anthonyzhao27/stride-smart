import { NextResponse } from "next/server";
import { generateCompleteWeek } from "@/lib/plan-generation/generateCompleteWeek";

export async function POST(req: Request) {
    const body = await req.json();
    const { uid, user } = body;

    const allPlans = [];

    for (let week = 1; week <= 1; week++) {
        const plan = await generateCompleteWeek(user, week);
    
        try {
            // Only try to save to Firestore if we're in a runtime environment with Firebase
            if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
                const { db } = await import("@/lib/firebase");
                const { doc, setDoc } = await import("firebase/firestore");
                
                if (db) {
                    console.log('Data being sent to Firestore:', JSON.stringify(plan, null, 2));
                    const planRef = doc(db, "users", uid, "plans", `week_${week}`);
                    await setDoc(planRef, plan);
                }
            }

            allPlans.push({ week, plan});
    
        } catch (error) {
            console.error("Failed to save plan:", error);
            return NextResponse.json({ success: false, error: "Invalid plan format" }, { status: 500 });
        }
    }
    return NextResponse.json({ success: true, allPlans});
}
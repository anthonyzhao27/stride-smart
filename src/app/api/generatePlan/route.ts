import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/cognitoAuth";
import { makePlanRepo } from "@/lib/planRepoFactory";
import { GenerateWeeklyPlans } from "@/application/GenerateWeeklyPlans";
import { GeneratePlansBodySchema } from "@/application/schemas/GeneratePlansSchema";
import type { User } from "@/domain/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const payload = await requireAuth(req).catch(() => null);
    if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = payload.sub;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = GeneratePlansBodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    try {
        const repo = makePlanRepo();
        const service = new GenerateWeeklyPlans(repo);
        const allPlans = await service.execute({
            user: parsed.data.user as unknown as User,
            userId,
            startWeek: parsed.data.startWeek,
            weeks: parsed.data.weeks,
        });
        return NextResponse.json({ success: true, allPlans });
    } catch (err) {
        console.error("GenerateWeeklyPlans failed", { message: (err as Error)?.message });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
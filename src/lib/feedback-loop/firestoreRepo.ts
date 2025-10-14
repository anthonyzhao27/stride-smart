import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { TrainingWeek } from "@/domain/types";

type SavePlanMetadata = {
    atISO: string;
    actor: string;
    operations: unknown[];
    changeset: unknown[];
    warnings: unknown[];
};

export const firestoreRepo = {
    async savePlan(
        userId: string,
        planId: string,
        updatedWeeks: TrainingWeek[],
        _version: number,
        _metadata: SavePlanMetadata
    ): Promise<void> {
        if (!db) throw new Error("Firestore is not initialized");
        // Mark unused params as used for linting without changing the call site
        void _version;
        void _metadata;

        // Persist each week as its own document: users/{userId}/plans/week_{n}
        // This aligns with plan generation storage and consumers that read per-week docs.
        for (const week of updatedWeeks) {
            const ref = doc(db, "users", userId, "plans", `week_${week.week}`);
            const payload = { ...week, updatedAt: new Date().toISOString() } as const;
            await setDoc(ref, payload);
        }
    },
};



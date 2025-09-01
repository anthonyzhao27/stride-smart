// firestoreRepo.ts
import { doc, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrainingWeek } from "@/lib/types";

// Simple interface for the repository
interface PlanRepo {
  savePlan(
    userId: string,
    planId: string,
    updatedPlan: TrainingWeek[],
    expectedVersion: number,
    audit: {
      atISO: string;
      actor: string;
      operations: unknown[];
      changeset: unknown[];
      warnings: string[];
    }
  ): Promise<{ newVersion: number }>;
}

export const firestoreRepo: PlanRepo = {
  async savePlan(userId, planId, updatedPlan, expectedVersion, audit) {
    console.log(`Saving plan for userId: ${userId}, planId: ${planId}, weeks: ${updatedPlan.length}`);
    
    if (!db) {
      throw new Error("Firestore not available");
    }
    
    // If this is a multi-week plan (current-plan), we need to save each week individually
    if (planId === 'current-plan' || planId === 'default') {
      // Save each week as a separate document
      for (const week of updatedPlan) {
        const weekRef = doc(db, "users", userId, "plans", week.id || `week_${week.week}`);
        
        // Convert Date objects to Firestore timestamps
        const weekData = {
          ...week,
          startDate: week.startDate,
          endDate: week.endDate,
          workouts: week.workouts.map(w => ({
            ...w,
            date: w.date
          })),
          updatedAt: audit.atISO,
          version: (week as { version?: number }).version || 0
        };
        
        await setDoc(weekRef, weekData, { merge: true });
      }
      
      return { newVersion: expectedVersion + 1 };
    } else {
      // Handle single plan document (legacy)
      const ref = doc(db, "users", userId, "plans", planId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Plan not found");
        const data = snap.data() as { version?: number; changelog?: unknown[] };
        const currentVersion = data.version ?? 0;
        if (currentVersion !== expectedVersion) {
          throw new Error("Version conflict");
        }
        tx.update(ref, {
          weeks: updatedPlan,
          version: currentVersion + 1,
          updatedAt: audit.atISO,
          // optional append-only audit log
          changelog: [...(data.changelog ?? []), audit],
        });
      });
      return { newVersion: expectedVersion + 1 };
    }
  },
};
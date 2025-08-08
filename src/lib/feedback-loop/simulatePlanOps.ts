// simulatePlanOps.ts
import { runOps } from "./runOps";
import { TrainingWeek } from "@/lib/types";
import { PlanOperation } from "./types";
import { Operation as PatchOp } from "fast-json-patch";

export function simulatePlanOps(
  plan: TrainingWeek[],
  ops: PlanOperation[]
): { updatedWeeks: TrainingWeek[]; changeset: PatchOp[]; warnings: string[] } {
  const { updatedWeeks, changeset, warnings } = runOps(plan, ops);
  return { updatedWeeks, changeset, warnings };
}
// runOps.ts
import { compare, Operation as PatchOp } from "fast-json-patch";
import { TrainingWeek } from "@/lib/types";
import { PlanOperation } from "./types";
import { applyOperation } from "./applyOperation";

export type RunOpsResult = {
  updatedPlan: TrainingWeek[];
  updatedWeeks: TrainingWeek[];
  changeset: PatchOp[];
  warnings: string[];
};

export function runOps(plan: TrainingWeek[], ops: PlanOperation[]): RunOpsResult {
  const original = JSON.parse(JSON.stringify(plan)) as TrainingWeek[];
  const working  = JSON.parse(JSON.stringify(plan)) as TrainingWeek[];

  const warnings: string[] = [];
  const changedWeeks = new Set<number>();

  for (const op of ops) {
    const { updatedWeek, warning } = applyOperation(working, op);
    if (warning) warnings.push(warning);
    if (updatedWeek) changedWeeks.add(updatedWeek.week);
  }

  // (optional) recompute aggregates on changed weeks
  for (const w of working) {
    if (changedWeeks.has(w.week)) recomputeWeekAggregates(w);
  }

  const changeset = compare(original, working);
  const updatedWeeks = working.filter(w => changedWeeks.has(w.week));

  return { updatedPlan: working, updatedWeeks, changeset, warnings };
}

// Example aggregate helper
function recomputeWeekAggregates(week: TrainingWeek) {
  week.totalMileage = Math.round(
    week.workouts.reduce((s, w) => s + (w.distance || 0), 0) * 10
  ) / 10;
  week.totalDuration = week.workouts.reduce((s, w) => s + (w.duration || 0), 0);
}

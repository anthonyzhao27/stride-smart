import { TrainingWorkout } from "@/lib/types";

export type PlanOperation =
    | MoveWorkoutOp
    | ReplaceWorkoutOp
    | ModifyWorkoutOp
    | InsertWorkoutOp
    | DeleteWorkoutOp
    | SwapWorkoutsOp
    | ShiftWeekOp
    | AdjustWeekVolumeOp
    | AdjustIntensityOp
    | SetPlanPropertyOp
    | AddAnnotationOp
    | ExplainWorkoutOp
    | AdjustWorkoutIntensityOp
    | ModifyWorkoutBasedOnFeedbackOp;

export type ApplyPlanOperationsRequest = {
    user_id: string;
    plan_id: string;
    tz: string;
    mode: "simulate" | "apply";
    operations: PlanOperation[];
};

type MoveWorkoutOp = {
  type: "MoveWorkout";
  date: string;     // ISO date string
  toDate: string;   // ISO date string
};

type ReplaceWorkoutOp = {
  type: "ReplaceWorkout";
  date: string;     // ISO date string
  workout: TrainingWorkout;
};

type ModifyWorkoutOp = {
  type: "ModifyWorkout";
  date: string;     // ISO date string
  newValues: Partial<TrainingWorkout>;
};

type InsertWorkoutOp = {
  type: "InsertWorkout";
  date: string;     // ISO date string
  workout: TrainingWorkout;
};

type DeleteWorkoutOp = {
  type: "DeleteWorkout";
  date: string;     // ISO date string
};

type SwapWorkoutsOp = {
  type: "SwapWorkouts";
  date: string;     // ISO date string
  toDate: string;   // ISO date string
};

type ShiftWeekOp = {
  type: "ShiftWeek";
  week: number;
  deltaDays: number; // e.g., +1 to move everything forward one day
};

type AdjustWeekVolumeOp = {
  type: "AdjustWeekVolume";
  week: number;
  factor: number; // e.g., 0.9 = reduce mileage by 10%
};

type AdjustIntensityOp = {
  type: "AdjustIntensity";
  week: number;
  direction: "up" | "down";
};

type SetPlanPropertyOp = {
  type: "SetPlanProperty";
  id?: string;
  comment?: string;
  tags?: string[];
};

type AddAnnotationOp = {
  type: "AddAnnotation";
  date: string;     // ISO date string
  comment: string;
};

type ExplainWorkoutOp = {
  type: "ExplainWorkout";
  date?: string;    // ISO date string (optional - if not provided, explain today's workout)
  query?: string;   // Specific question about the workout
};

type AdjustWorkoutIntensityOp = {
    type: "AdjustWorkoutIntensity";
    date: string;
    adjustment: "easier" | "harder" | "skip" | "moderate";
    reason: string; // "fatigue", "injury", "feeling_great", etc.
    userFeedback: string;
  };
  
type ModifyWorkoutBasedOnFeedbackOp = {
    type: "ModifyWorkoutBasedOnFeedback";
    date: string;
    userFeedback: string;
    suggestedModifications: {
        intensity?: "easier" | "harder" | "skip";
        distance?: number;
        duration?: number;
        type?: "easy" | "recovery" | "original";
    };
};
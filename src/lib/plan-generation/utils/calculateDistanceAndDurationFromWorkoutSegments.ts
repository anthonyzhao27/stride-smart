import { WorkoutSegment, TrainingPaces, WorkoutSet, TrainingDist } from "@/lib/types";

export function calculateDistanceAndDurationFromWorkoutSegments(workoutSegments: WorkoutSegment[] | undefined, trainingPaces: TrainingPaces): { distance: number, duration: number } {
    if (!workoutSegments || workoutSegments.length === 0) {
        return { distance: 0, duration: 0 };
    }

    let distance = 0;
    let duration = 0;

    workoutSegments.forEach((set: WorkoutSegment) => {
        if (typeof set === "number") {
            duration += set;
            return;
        }
        set = set as WorkoutSet;

        const pace = trainingPaces[set.type as TrainingDist];
        const paceValue = Array.isArray(pace) ? pace[0] : pace;

        distance += (set.length.type == "time" ? 1 / paceValue * set.length.amount : Math.round(set.length.amount / 1609 * 100) / 100) * (set.reps || 1);
        
        duration += ((set.length.type == "time" ? set.length.amount : Math.round(set.length.amount / 1609 * paceValue)) + (set.rest || 0)) * (set.reps || 1);
    });

    return { distance: Math.round(distance / 0.5) * 0.5, duration: Math.ceil(duration / 300) * 300 };
}
import { WorkoutSegment, TrainingPaces, WorkoutSet, TrainingDist } from "../../types";

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

        distance += 1 / paceValue * set.duration * (set.reps || 1);
        
        duration += (set.duration + (set.rest || 0)) * (set.reps || 1)
    });

    return { distance, duration };
}
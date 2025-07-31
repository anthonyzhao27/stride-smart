import { WorkoutSegment, TrainingPaces, PaceEntry, WorkoutSet, TrainingDist } from "@/lib/types";

export function getTrainingPacesFromWorkoutSegments(workoutSegments: WorkoutSegment[] | undefined, trainingPaces: TrainingPaces, targetPaces: PaceEntry[] ): PaceEntry[] {
    if (!workoutSegments || workoutSegments.length === 0) {
        return targetPaces;
    }
    
    workoutSegments.forEach((set: WorkoutSegment) => {
        if (typeof set === "number") {
            return; // Skip if it's just a number (rest)
        }
        set = set as WorkoutSet;

        const pace = trainingPaces[set.type as TrainingDist];

        // Add an object with the set type and paceValue, if not already present
        if (
            pace !== undefined &&
            pace !== null &&
            !targetPaces.some(obj => obj.type === set.type && obj.pace === pace)
        ) {
            targetPaces.push({ type: set.type as string, pace: pace });
        }
    });

    return targetPaces;
}
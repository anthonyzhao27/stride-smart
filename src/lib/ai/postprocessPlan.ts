import { TrainingWeek, User, WorkoutSet, TrainingDist, WorkoutSegment, TrainingPaces, PaceEntry } from "@/lib/types";
import { getTrainingPaces } from "@/lib/training/getTrainingPaces";
import { getMileageProgression } from "@/lib/training/getMileageProgression";


function getWeekStartDate(startDate: Date, week: number): Date {
    const start = new Date(startDate);
    const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Move to the *first* Monday on or after the startDate
    const daysToNextMonday = (8 - dayOfWeek) % 7 || 7;
    const firstMonday = new Date(start);
    firstMonday.setDate(start.getDate() + daysToNextMonday);

    // If week is 1, return the original startDate's Monday if it's already Monday
    if (week === 1) {
        return dayOfWeek === 1 ? start : firstMonday;
    }

    // Add (week - 1) * 7 days to the first Monday
    const targetMonday = new Date(firstMonday);
    targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
    return targetMonday;
}

function calculateDistanceAndDurationFromWorkoutSegments(workoutSegments: WorkoutSegment[] | undefined, trainingPaces: TrainingPaces): { distance: number, duration: number } {
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

function getTrainingPacesFromWorkoutSegments(workoutSegments: WorkoutSegment[] | undefined, trainingPaces: TrainingPaces, targetPaces: PaceEntry[] ): PaceEntry[] {
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

function adjustEasyRunsForMileage(weekPlan: Omit<TrainingWeek, 'startDate' | 'endDate'>, targetMileage: number, trainingPaces: TrainingPaces, margin = 1) {
    const longRun = weekPlan.workouts.find(workout => workout.tags === 'LongRun');

    if (longRun && longRun.distance && longRun.distance > (targetMileage >= 50 ? targetMileage * 0.25 : targetMileage * 0.2)) {
        longRun.distance = Math.floor((targetMileage >= 50 ? targetMileage * 0.25 : targetMileage * 0.2) * 2) / 2; // Round to nearest 0.5

        longRun.duration = Math.round(longRun.distance * trainingPaces['Easy'][0] * 300) / 300 + 300; // Round to nearest 0.5 minutes
    }

    weekPlan.totalMileage = weekPlan.workouts.reduce((total, workout) => total + (workout.distance || 0), 0);
    weekPlan.totalDuration = weekPlan.workouts.reduce((total, workout) => total + (workout.duration || 0), 0);

    const actualMileage: number = weekPlan.totalMileage || 0;
    const mileageDiff = targetMileage - actualMileage;

    if (Math.abs(mileageDiff) <= margin) {
        return weekPlan; // No adjustment needed
    }

    const easyRuns = weekPlan.workouts.filter((workout) =>
        workout.tags === 'Easy'
    );

    const mileagePerRun = easyRuns.length > 0 ? Math.round(mileageDiff / easyRuns.length * 2) / 2 : 0; // Round to nearest 0.5

    weekPlan.workouts.forEach((workout) => {
        if (easyRuns.includes(workout)) {
            workout.distance = Math.max(Math.round((workout.distance + mileagePerRun) * 2) / 2, 0); // Round to nearest 0.5, ensure non-negative

            workout.duration = Math.round(workout.distance * trainingPaces['Easy'][0] * 300) / 300 + 300;
        }
    });

    weekPlan.totalMileage = weekPlan.workouts.reduce((total, workout) => total + (workout.distance || 0), 0);
    weekPlan.totalDuration = weekPlan.workouts.reduce((total, workout) => total + (workout.duration || 0), 0);

    return weekPlan;
}

export function postprocessPlan(workoutWeek: Omit<TrainingWeek, 'startDate' | 'endDate'>, weekNum: number, user: User): TrainingWeek {
    /* Stuff to postprocess:
        startDate
        endDate
        totalMileage

        targetPace
        totalDistance
        totalDuration
     */
    const {planStartDate, currentRaceTime, currentRaceDistance, goalRaceTime, goalRaceDistance, numWeeks} = user;

    console.log(planStartDate, currentRaceTime, currentRaceDistance, goalRaceTime, goalRaceDistance, numWeeks);

    const weekStartDate = getWeekStartDate(new Date(planStartDate), weekNum)

    let totalMileage = 0;
    let totalDuration = 0;

    const trainingPaces = getTrainingPaces(currentRaceDistance, currentRaceTime, goalRaceDistance, goalRaceTime, numWeeks, weekNum);
    
    for (let i = 0; i < workoutWeek.workouts.length; i++) {
        const ithWorkout = workoutWeek.workouts[i];

        ithWorkout.date = new Date((weekStartDate).getTime() + i * 24 * 60 * 60 * 1000);

        let targetPaces: PaceEntry[] = [];

        // Get target paces from warmup, workout, and cooldown segments

        targetPaces = getTrainingPacesFromWorkoutSegments(ithWorkout.warmup, trainingPaces, targetPaces);
        targetPaces = getTrainingPacesFromWorkoutSegments(ithWorkout.workout, trainingPaces, targetPaces);
        targetPaces = getTrainingPacesFromWorkoutSegments(ithWorkout.cooldown, trainingPaces, targetPaces);

        let distance = 0;
        let duration = 0;
        
        const { distance: warmupDistance, duration: warmupDuration } = calculateDistanceAndDurationFromWorkoutSegments(ithWorkout.warmup, trainingPaces);

        const { distance: workoutDistance, duration: workoutDuration } = calculateDistanceAndDurationFromWorkoutSegments(ithWorkout.workout, trainingPaces);

        const { distance: cooldownDistance, duration: cooldownDuration } = calculateDistanceAndDurationFromWorkoutSegments(ithWorkout.cooldown, trainingPaces);

        distance = warmupDistance + workoutDistance + cooldownDistance;
        duration = warmupDuration + workoutDuration + cooldownDuration;

        ithWorkout.targetPace = targetPaces;
        
        ithWorkout.distance = Math.round(distance * 2) / 2;

        ithWorkout.duration = (Math.ceil(duration / 300)) * 300 + 600;

        totalMileage += ithWorkout.distance;
        totalDuration += ithWorkout.duration;
    }
    workoutWeek.totalMileage = totalMileage;
    workoutWeek.totalDuration = totalDuration;
    
    const targetMileage = getMileageProgression(user)[weekNum - 1];

    workoutWeek = adjustEasyRunsForMileage(workoutWeek, targetMileage, trainingPaces);

    return {
        ...workoutWeek,
        id: workoutWeek.id ?? `week-${weekNum}`,
        startDate: weekStartDate,
        endDate: new Date((weekStartDate).getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days later
    }
}
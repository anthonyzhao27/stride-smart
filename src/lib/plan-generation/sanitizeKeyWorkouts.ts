import { TrainingWorkout, TrainingWeek } from "@/lib/types";
import { assignWorkoutDays } from "@/lib/plan-generation/assignWorkoutDays";
import { getMileageProgression } from "@/lib/plan-generation/utils/getMileageProgression";
import { User } from "@/lib/types";
import { getDayToDate, getWeekStartDate } from "@/lib/plan-generation/utils/getWeekStartDate";
import { getTrainingPacesFromWorkoutSegments } from "@/lib/plan-generation/utils/getTrainingPacesFromWorkoutSegments";
import { calculateDistanceAndDurationFromWorkoutSegments } from "@/lib/plan-generation/utils/calculateDistanceAndDurationFromWorkoutSegments";
import { getTrainingPaces } from "@/lib/plan-generation/utils/getTrainingPaces";

export function sanitizeKeyWorkouts(input: User, workouts: TrainingWorkout[], week: number): TrainingWeek {
    const mileageProgression = getMileageProgression(input);
    
    const raceSpecific = mileageProgression[week - 1].raceSpecific;

    const LT1s = workouts.filter(w => w.tags === "LT1");
    const LT2s = workouts.filter(w => w.tags === "LT2");
    const Hills = workouts.find(w => w.tags === "Hills");
    const LongRun = workouts.find(w => w.tags === "LongRun");

    const assigned: TrainingWorkout[] = [];

    const { doubleThresholdDays, LT1Day, LT2Day, HillsRaceDay, LongRunDay } = assignWorkoutDays(input, raceSpecific);

    const daysToDates = getDayToDate(new Date(input.planStartDate), week);

    if (doubleThresholdDays && LT1s.length > 0 && LT2s.length > 0) {
        doubleThresholdDays.forEach(doubleThresholdDay => {
            {
                const lt1 = LT1s.shift()!;
                assigned.push({
                    ...lt1,
                    dayOfWeek: doubleThresholdDay,
                    name: `(AM) ${lt1.name}`,
                    date: daysToDates.get(doubleThresholdDay)
                } as TrainingWorkout);
                const lt2 = LT2s.shift()!;
                assigned.push({
                    ...lt2,
                    dayOfWeek: doubleThresholdDay,
                    name: `(PM) ${lt2.name}`,
                    date: daysToDates.get(doubleThresholdDay)
                } as TrainingWorkout);
            }
        })
    }

    if (LT1s.length > 0 && LT1Day) {
        const lt1 = LT1s.shift()!;

        assigned.push({
            ...lt1,
            dayOfWeek: LT1Day,
            date: daysToDates.get(LT1Day)
        } as TrainingWorkout);
    }

    if (LT2s.length > 0 && LT2Day) {
        const lt2 = LT2s.shift()!;

        assigned.push({
            ...lt2,
            dayOfWeek: LT2Day,
            date: daysToDates.get(LT2Day)
        } as TrainingWorkout);
    }

    if (Hills && HillsRaceDay) {
        const hills = Hills;

        assigned.push({
            ...hills,
            dayOfWeek: HillsRaceDay,
            date: daysToDates.get(HillsRaceDay)
        } as TrainingWorkout);
    }

    if (LongRun && LongRunDay) {
        const longRun = LongRun;

        assigned.push({
            ...longRun,
            dayOfWeek: LongRunDay,
            date: daysToDates.get(LongRunDay)
        } as TrainingWorkout);
    }

    let totalMileage = 0;
    let totalDuration = 0;

    const trainingPaces = getTrainingPaces(input.currentRaceDistance, input.currentRaceTime, input.goalRaceDistance, input.goalRaceTime, input.numWeeks, week);

    assigned.forEach(workout => {
        const mileage = calculateDistanceAndDurationFromWorkoutSegments(workout.warmup, trainingPaces).distance + calculateDistanceAndDurationFromWorkoutSegments(workout.workout, trainingPaces).distance;

        const duration = calculateDistanceAndDurationFromWorkoutSegments(workout.warmup, trainingPaces).duration + calculateDistanceAndDurationFromWorkoutSegments(workout.workout, trainingPaces).duration;
        
        let proposedTotalMileage = Math.ceil(mileage) + 1;

        while (10 >= (proposedTotalMileage - mileage) * trainingPaces['Easy'][0]) {
            proposedTotalMileage += 1;
        }

        while (20 <= (proposedTotalMileage - mileage) * trainingPaces['Easy'][0]) {
            proposedTotalMileage -= 0.5;
        }
        
        workout.distance = proposedTotalMileage;
        workout.duration = duration + (proposedTotalMileage - mileage) * trainingPaces['Easy'][0];
        workout.cooldown = `Cooldown to ${proposedTotalMileage}`
        workout.targetPace = getTrainingPacesFromWorkoutSegments(workout.workout, trainingPaces, []);

        totalMileage += workout.distance;
        totalDuration += workout.duration;
    })

    return {
        workouts: assigned,
        id: `week-${week}`,
        week: week,
        startDate: getWeekStartDate(new Date(input.planStartDate), week),
        endDate: new Date(getWeekStartDate(new Date(input.planStartDate), week).getTime() + 6 * 24 * 60 * 60 * 1000),
        totalMileage: totalMileage,
        totalDuration: totalDuration
    }
}
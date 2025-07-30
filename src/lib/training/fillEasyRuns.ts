import { getMileageProgression } from "./utils/getMileageProgression";
import { User, TrainingWeek, PaceEntry } from "@/lib/types";
import { assignWorkoutDays } from "./assignWorkoutDays";
import { getTrainingPaces } from "./utils/getTrainingPaces";
import { getDayToDate } from "./utils/getWeekStartDate";

export function fillEasyRuns(input: User, trainingWeek: TrainingWeek, week: number) {
    const { trainingDays, currentRaceDistance, currentRaceTime, goalRaceDistance, goalRaceTime, numWeeks } = input;

    const trainingPaces = getTrainingPaces(
        currentRaceDistance,
        currentRaceTime,
        goalRaceDistance,
        goalRaceTime,
        numWeeks,
        week
    )

    const mileageProgression = getMileageProgression(input);

    const { mileage: goalMileage, raceSpecific } = mileageProgression[week - 1]

    let { totalMileage: currentMileage } = trainingWeek;

    const { doubleThresholdDays, LT1Day, LT2Day, HillsRaceDay, LongRunDay } = assignWorkoutDays(input, raceSpecific);

    const daysToDates = getDayToDate(new Date(input.planStartDate), week);

    // First add in the long run manually

    const longRunDist = Math.floor(0.2 * goalMileage) + 1;

    trainingWeek.workouts.push({
        name: "Long Run",
        date: daysToDates.get(LongRunDay ?? "") ?? new Date(),
        dayOfWeek: LongRunDay ?? "",
        tags: "LongRun",
        distance: longRunDist,
        duration: longRunDist * trainingPaces['Easy'][0],
        targetHeartRate: "<70% MHR",
        targetPace: [{ type: "Easy", pace: trainingPaces['Easy'] } as PaceEntry],
        ...(input.trainingDays.length === 4 && { notes: "Progress into LT1"})
    })
    currentMileage += longRunDist;

    const numWorkoutDays = (doubleThresholdDays ? doubleThresholdDays.length : 0) + (LT1Day ? 1 : 0) + (LT2Day ? 1 : 0) + (HillsRaceDay ? 1 : 0) + (LongRunDay ? 1 : 0);

    const numEasyDays = trainingDays.length - numWorkoutDays;

    const diff = goalMileage - currentMileage;

    const easyMiles: number[] | number[][] = divideEasyMileage(diff, numEasyDays);

    const modifiedEasyMiles: (number | [number, number])[] = Array.from(easyMiles);

    const maxEasyPerRun = Math.ceil(70 * 60 / trainingPaces['Easy'][0]); // sec/mi

    easyMiles.forEach((miles, idx) => {
        if (miles > maxEasyPerRun) {
            let PMDoubleRun = Math.ceil(25 * 60 / trainingPaces['Easy'][0]);
            let AMDoubleRun = miles - PMDoubleRun;
            while (AMDoubleRun > maxEasyPerRun) {
                AMDoubleRun -= 1
                PMDoubleRun += 1
            }
            modifiedEasyMiles[idx] = [AMDoubleRun, PMDoubleRun];
        }
        currentMileage += miles;
    }) // Splits longer easy runs into doubles

    const nonWorkoutDays = trainingDays.filter(day => ![doubleThresholdDays, LT1Day, LT2Day, HillsRaceDay, LongRunDay].flat().includes(day));

    modifiedEasyMiles.forEach((miles, idx) => {
        if (Array.isArray(miles) && miles.length === 2) {
            const tod = ['AM', 'PM'];
            miles.forEach((run, runIdx) => {
                trainingWeek.workouts.push({
                    name: `${tod[runIdx]} Easy Run`,
                    date: daysToDates.get(nonWorkoutDays[idx]) ?? new Date(),
                    dayOfWeek: nonWorkoutDays[idx],
                    tags: 'Easy',
                    distance: run,
                    duration: run * trainingPaces['Easy'][0],
                    targetHeartRate: "<70% MHR",
                    targetPace: [{ type: "Easy", pace: trainingPaces['Easy'] } as PaceEntry]
                });
                trainingWeek.totalDuration += Math.ceil(run * trainingPaces['Easy'][0] / 300) * 300;
            });
        } else if (typeof miles === "number") {
            trainingWeek.workouts.push({
                name: "Easy Run",
                date: daysToDates.get(nonWorkoutDays[idx]) ?? new Date(),
                dayOfWeek: nonWorkoutDays[idx],
                tags: 'Easy',
                distance: miles,
                duration: miles * trainingPaces['Easy'][0],
                targetHeartRate: "<70% MHR",
                targetPace: [{ type: "Easy", pace: trainingPaces['Easy'] } as PaceEntry]
            });
            trainingWeek.totalDuration += Math.ceil(miles * trainingPaces['Easy'][0] / 300) * 300;
        }
    });

    return {...trainingWeek, totalMileage: currentMileage};
}

function divideEasyMileage(miles: number, numDays: number): number[] {
    if (numDays <= 0) throw new Error("Parts must be a positive integer.");
    if (miles < 0) throw new Error("Total must be non-negative.");
    if (miles / 0.5 % 1 !== 0) miles = Math.floor(miles / 0.5) * 0.5;


    const base = Math.floor((miles / numDays) * 2) / 2;
    const result = new Array(numDays).fill(base);

    let remainder = miles - base * numDays;
    let i = 0;
    while (remainder > 0 && i < numDays) {
        result[i] += 0.5;
        remainder -= 0.5;
        i++;
    }

    return result;
}
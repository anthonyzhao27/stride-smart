import { WorkoutDays, User } from "@/lib/types";

export function assignWorkoutDays(user: User, raceSpecific: boolean): WorkoutDays {
    /*
        If the user can only train 4 days a week, structure as follows:
        Maximum workouts:
        - One day VO2 only when peaking
        - One day LT2
        - One day Long progression into LT1
        - One day easy

        If the user can only train 5 days a week, structure as follows:
        Maximum workouts:
        - One day VO2
        - One day LT2
        - One day easy long run
        - One easy
        - One day LT1

        If the user can train at least 6 days a week, structure as follows:
        Maximum workouts:
        - One day VO2
        - One day LT2
        - One day easy long run
        - One day LT1
        - Rest easy

        RULES:
        - VO2 and LT2 and LT1 must have at least one recovery day in between
        - Long run can be on any day that isn't a workout day
    */

    const { trainingDays, numDaysDoubleThreshold } = user;

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    if (trainingDays.length == 4) {
        return raceSpecific ? {LT2Day: trainingDays[1], HillsRaceDay: trainingDays[3]} : { LongRunDay: trainingDays[1], LT2Day: trainingDays[3]};
    } else if (trainingDays.length === 5) {
        const missingDays = weekdays.filter(day => !trainingDays.includes(day));

        const reorderedTrainingDays = [weekdays.slice(weekdays.indexOf(missingDays[0]) + 1, weekdays.indexOf(missingDays[1])), [weekdays.slice(weekdays.indexOf(missingDays[1]) + 1), weekdays.slice(0, weekdays.indexOf(missingDays[0]))].flat()];
        
        reorderedTrainingDays.sort((a, b) => b.length - a.length);

        switch (reorderedTrainingDays[0].length) {
            case 5:
                return {
                    LT1Day: reorderedTrainingDays[0][0],
                    LT2Day: reorderedTrainingDays[0][2],
                    HillsRaceDay: reorderedTrainingDays[0][4],
                    LongRunDay: reorderedTrainingDays[0][1]
                } as WorkoutDays;
            case 4:
                return {
                    LT1Day: reorderedTrainingDays[0][1],
                    LT2Day: reorderedTrainingDays[0][3],
                    HillsRaceDay: reorderedTrainingDays[1][0],
                    LongRunDay: reorderedTrainingDays[0][0]
                } as WorkoutDays;
            case 3:
                return {
                    LT1Day: reorderedTrainingDays[0][0],
                    LT2Day: reorderedTrainingDays[0][2],
                    HillsRaceDay: reorderedTrainingDays[1][1],
                    LongRunDay: reorderedTrainingDays[0][1]
                } as WorkoutDays;
        }
    } else if (trainingDays.length === 6) {
        let reorderedTrainingDays = [...trainingDays];
        const missingDay = weekdays.find(day => !trainingDays.includes(day));
        if (missingDay) {
            reorderedTrainingDays = [weekdays.slice(weekdays.indexOf(missingDay) + 1), weekdays.slice(0, weekdays.indexOf(missingDay))].flat();
        }
        return {
            LT1Day: reorderedTrainingDays[1],
            LT2Day: reorderedTrainingDays[3],
            HillsRaceDay: reorderedTrainingDays[5],
            LongRunDay: reorderedTrainingDays[0]
        } as WorkoutDays;
    } else {
        switch (numDaysDoubleThreshold) {
            case 0:
                return {
                    LT1Day: trainingDays[1],
                    LT2Day: trainingDays[3],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                } as WorkoutDays;
            case 1:
                return {
                    doubleThresholdDays: [trainingDays[1]],
                    LT2Day: trainingDays[3],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                } as WorkoutDays;
            case 2:
                return {
                    doubleThresholdDays: [trainingDays[1], trainingDays[3]],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                } as WorkoutDays;
        }
    }
    throw new Error("Unable to assign workout days: invalid input or unsupported configuration.");
}
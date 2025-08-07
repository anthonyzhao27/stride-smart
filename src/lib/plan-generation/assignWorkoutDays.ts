import { WorkoutDays, User } from "@/lib/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function assignWorkoutDays(user: User, raceSpecific: boolean): WorkoutDays {
    const { trainingDays, numDaysDoubleThreshold } = user;

    // Helper: return the missing days from a full week
    const getMissingDays = () => WEEKDAYS.filter(day => !trainingDays.includes(day));

    // Helper: reorder days starting after a given day
    const reorderAfter = (day: string) => {
        const idx = WEEKDAYS.indexOf(day);
        return [...WEEKDAYS.slice(idx + 1), ...WEEKDAYS.slice(0, idx)];
    };

    // 4 training days
    if (trainingDays.length === 4) {
        return raceSpecific
            ? { LT2Day: trainingDays[1], HillsRaceDay: trainingDays[3] }
            : { LongRunDay: trainingDays[1], LT2Day: trainingDays[3] };
    }

    // 5 training days
    if (trainingDays.length === 5) {
        const missing = getMissingDays();
        const blocks = [
            WEEKDAYS.slice(WEEKDAYS.indexOf(missing[0]) + 1, WEEKDAYS.indexOf(missing[1])),
            [
                ...WEEKDAYS.slice(WEEKDAYS.indexOf(missing[1]) + 1),
                ...WEEKDAYS.slice(0, WEEKDAYS.indexOf(missing[0]))
            ]
        ];
        blocks.sort((a, b) => b.length - a.length);

        const main = blocks[0], side = blocks[1];

        if (main.length === 5) {
            return { LT1Day: main[0], LT2Day: main[2], HillsRaceDay: main[4], LongRunDay: main[1] };
        }
        if (main.length === 4) {
            return { LT1Day: main[1], LT2Day: main[3], HillsRaceDay: side[0], LongRunDay: main[0] };
        }
        if (main.length === 3) {
            return { LT1Day: main[0], LT2Day: main[2], HillsRaceDay: side[1], LongRunDay: main[1] };
        }
    }

    // 6 training days
    if (trainingDays.length === 6) {
        const missing = WEEKDAYS.find(day => !trainingDays.includes(day));
        const reordered = missing ? reorderAfter(missing) : [...trainingDays];
        if (numDaysDoubleThreshold) {
            switch (numDaysDoubleThreshold) {
                case 0:
                    return {
                        LT1Day: trainingDays[1],
                        LT2Day: trainingDays[3],
                        HillsRaceDay: trainingDays[5],
                        LongRunDay: trainingDays[0]
                    };
                case 1:
                    return {
                        doubleThresholdDays: [trainingDays[1]],
                        LT2Day: trainingDays[3],
                        HillsRaceDay: trainingDays[5],
                        LongRunDay: trainingDays[0]
                    };
                case 2:
                    return {
                        doubleThresholdDays: [trainingDays[1], trainingDays[3]],
                        HillsRaceDay: trainingDays[5],
                        LongRunDay: trainingDays[0]
                    };
            }
        }
        return { LT1Day: reordered[1], LT2Day: reordered[3], HillsRaceDay: reordered[5], LongRunDay: reordered[0] };
    }

    // 7 training days
    if (numDaysDoubleThreshold) {
        switch (numDaysDoubleThreshold) {
            case 0:
                return {
                    LT1Day: trainingDays[1],
                    LT2Day: trainingDays[3],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                };
            case 1:
                return {
                    doubleThresholdDays: [trainingDays[1]],
                    LT2Day: trainingDays[3],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                };
            case 2:
                return {
                    doubleThresholdDays: [trainingDays[1], trainingDays[3]],
                    HillsRaceDay: trainingDays[5],
                    LongRunDay: trainingDays[6]
                };
        }
    }
    return { LT1Day: trainingDays[1], LT2Day: trainingDays[3], HillsRaceDay: trainingDays[5], LongRunDay: trainingDays[6] };

    throw new Error("Unable to assign workout days: invalid input or unsupported configuration.");
}

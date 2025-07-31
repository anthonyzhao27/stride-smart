import { User } from "@/lib/types";
import { getMileageProgression } from "./getMileageProgression";

export function getThresholdTimeTargets(user: User, week: number): { LT1: number, LT2: number } {
    const { experience, numDaysDoubleThreshold } = user;
    if (experience === "advanced" && numDaysDoubleThreshold && numDaysDoubleThreshold > 0) {
        return { LT1: 30, LT2: 30 };
    }

    const mileageProgression = getMileageProgression(user);
    const targetMileage = mileageProgression[week - 1];

    const thresholds = [
        { min: 50, LT1: 48, LT2: 42 },
        { min: 40, LT1: 42, LT2: 36 },
        { min: 30, LT1: 36, LT2: 30 }
    ];

    for (const t of thresholds) {
        if (targetMileage.mileage > t.min) {
            return { LT1: t.LT1, LT2: t.LT2 };
        }
    }
    return { LT1: 30, LT2: 25 };
}
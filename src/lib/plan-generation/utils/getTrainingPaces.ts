import vdot from "@/lib/plan-generation/vdot.json";
import { RaceDist, TrainingPaces } from "@/lib/types"

type RacePaces = {
    "1500": number;
    "Mile": number;
    "3K": number;
    "5K": number;
    "10K": number;
    "Half Marathon": number;
    "Marathon": number;
}

function toSecondsFlexible(time: string): number {
    const parts = time.split(":").map(Number);
    if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
        const [m, s] = parts;
        return m * 60 + s;
    } else {
        throw new Error(`Unsupported time format: ${time}`);
    }
}

export function formatPace(secondsPerMile: number): string {
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} min/mi`;
}

function getTrainingPacesFromTime(
    distance: RaceDist,
    time: string, isGoal: boolean = false
): RacePaces {
    let res = vdot[vdot.length - 1];
    for (let i = 0; i < vdot.length; i++) {
        const entry = vdot[i];
        if (toSecondsFlexible(entry[distance]) < toSecondsFlexible(time)) {
        res = i > 0 ? (isGoal ? vdot[i] : vdot[i - 1]) : entry;
        break;
        }
    }
    return {
        "1500": toSecondsFlexible(res["1500"]) / 0.93,
        "Mile": toSecondsFlexible(res["Mile"]) / 1.61,
        "3K": toSecondsFlexible(res["3K"]) / 1.86,
        "5K": toSecondsFlexible(res["5K"]) / 3.11,
        "10K": toSecondsFlexible(res["10K"]) / 6.21,
        "Half Marathon": toSecondsFlexible(res["Half Marathon"]) / 13.11,
        "Marathon": toSecondsFlexible(res["Marathon"]) / 26.22,
    };
}

export function getTrainingPaces(
    currentRaceDistance: RaceDist,
    currentRaceTime: string,
    goalRaceDistance: RaceDist,
    goalRaceTime: string,
    numWeeks: number,
    week: number
): TrainingPaces {
    const currentPaces = getTrainingPacesFromTime(currentRaceDistance, currentRaceTime);
    const goalPaces = getTrainingPacesFromTime(goalRaceDistance, goalRaceTime, true);

    const result: TrainingPaces = {
        "1500": 0,
        "Mile": 0,
        "3K": 0,
        "5K": 0,
        "10K": 0,
        "Half Marathon": 0,
        "Marathon": 0,
        "LT1": [0, 0],
        "LT2": [0, 0],
        "Easy": [0, 0],
        "Hills": [0, 0]
    };

    for (const key of Object.keys(goalPaces).filter(k =>
        ["1500", "Mile", "3K", "5K", "10K", "Half Marathon", "Marathon"].includes(k)
    ) as RaceDist[]) {
        const interpolated = currentPaces[key] + (goalPaces[key] - currentPaces[key]) * ((week - 1) / (numWeeks - 1));
        result[key] = interpolated;
    }

    // Add training zone paces
    const LT1 = Math.ceil(result["Marathon"]! / 5) * 5 + 15;
    result["LT1"] = [LT1, LT1 + 20];

    const LT2 = Math.ceil(result["Half Marathon"]! / 5) * 5 + 15;
    result["LT2"] = [LT2, LT2 + 20];

    const Easy = Math.ceil(result["Marathon"]! / 5) * 5 + 90
    result["Easy"] = [Easy, Easy + 60];

    const Hills = Math.ceil(result["5K"]! / 5) * 5 + 15;
    result["Hills"] = [Hills, Hills + 20];

    return result;
}
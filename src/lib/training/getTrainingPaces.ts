import vdot from "./vdot.json";

type TrainingPaces = {
    vdot: number;
    m1500Pace: string;
    m3000Pace: string;
    m5000Pace: string;
    m10000Pace: string;
    lt2Pace: string;
    lt1Pace: string;
    easyPace: string;
};

function toSecondsFlexible(time: string): number {
    if (typeof time !== "string") {
        console.error("Invalid time passed to toSecondsFlexible:", time);
        throw new Error("Expected a time string in HH:MM:SS or MM:SS format, but got " + typeof time);
    }

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


function formatPace(secondsPerMile: number): string {
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} min/mi`;
}

export function getTrainingPaces(
    distance: "Mile" | "1500" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon",
    time: string
): TrainingPaces {
    let res = vdot[vdot.length - 1]; // Default to the last entry

    for (let i = 0; i < vdot.length; i++) {
        const entry = vdot[i];
        if (toSecondsFlexible(entry[distance]) < toSecondsFlexible(time)) {
            res = i > 0 ? vdot[i - 1] : entry;
            break;
        }
    }

    return {
        vdot: res['VDOT'],
        m1500Pace: formatPace(toSecondsFlexible(res['1500']) / 0.93),
        m3000Pace: formatPace(toSecondsFlexible(res['3K']) / 1.86),
        m5000Pace: formatPace(toSecondsFlexible(res['5K']) / 3.11),
        m10000Pace: formatPace(toSecondsFlexible(res['10K']) / 6.21),
        lt2Pace: `${formatPace(toSecondsFlexible(res['Half Marathon']) / 13.11 + 5)} - ${formatPace(toSecondsFlexible(res['Half Marathon']) / 13.11 + 20)}`,
        lt1Pace: `${formatPace(toSecondsFlexible(res['Marathon']) / 26.22 + 5)} - ${formatPace(toSecondsFlexible(res['Marathon']) / 26.22 + 20)}`,
        easyPace: `${formatPace(toSecondsFlexible(res['Marathon']) / 26.22 + 90)} - ${formatPace(toSecondsFlexible(res['Marathon']) / 26.22 + 150)}`
    };
}

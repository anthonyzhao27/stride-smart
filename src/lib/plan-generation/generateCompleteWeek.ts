import { User, TrainingWeek } from "@/lib/types";
import { generateKeyWorkouts } from "@/lib/plan-generation/generateKeyWorkouts";
// import { assignWorkoutDays } from "./assignWorkoutDays";
import { fillEasyRuns } from "@/lib/plan-generation/fillEasyRuns";
// import { getMileageProgression } from "./utils/getMileageProgression";
import { sanitizeKeyWorkouts } from "@/lib/plan-generation/sanitizeKeyWorkouts";
import { postProcessWeek } from "@/lib/plan-generation/postProcessWeek";

export async function generateCompleteWeek(user: User, week: number): Promise<TrainingWeek> {
    const keyWorkouts = await generateKeyWorkouts(user, week);
    // console.log("Key Workouts");
    // console.log(JSON.stringify(keyWorkouts, null, 2));

    const sanitizedKeyWorkouts = sanitizeKeyWorkouts(user, keyWorkouts, week);

    console.log("Sanitized Key Workouts");
    console.log(JSON.stringify(sanitizedKeyWorkouts, null, 2));

    const fullWeek = fillEasyRuns(user, sanitizedKeyWorkouts, week);

    const cleaned = postProcessWeek(user, fullWeek);

    // console.log("Cleaned Training week");

    // console.log(JSON.stringify(cleaned, null, 2));

    return cleaned;
}
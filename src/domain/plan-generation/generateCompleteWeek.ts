import { User, TrainingWeek } from "@/domain/types";
import { generateKeyWorkouts } from "@/domain/plan-generation/generateKeyWorkouts";
// import { assignWorkoutDays } from "./assignWorkoutDays";
import { fillEasyRuns } from "@/domain/plan-generation/fillEasyRuns";
// import { getMileageProgression } from "./utils/getMileageProgression";
import { sanitizeKeyWorkouts } from "@/domain/plan-generation/sanitizeKeyWorkouts";
import { postProcessWeek } from "@/domain/plan-generation/postProcessWeek";

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
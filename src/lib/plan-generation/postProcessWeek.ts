import { User, TrainingWeek } from "@/lib/types";

export function postProcessWeek(user: User, trainingWeek: TrainingWeek): TrainingWeek {
    const { trainingDays } = user;
    
    // Organize workout days by order in week
    trainingWeek.workouts.sort((a, b) => {
        return trainingDays.indexOf(a.dayOfWeek) - trainingDays.indexOf(b.dayOfWeek);
    })

    return trainingWeek;
}
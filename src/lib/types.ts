export type Workout = {
    id: string;
    name: string;
    date: string;
    time: string;
    timestamp: Date;
    duration: number;
    distance: number;
    unit: string;
    type: string;
    effortLevel: string;
    notes: string;
}

export type FormData = {
    name: string;
    type: string;
    date: string;
    time: string;
    timestamp: Date;
    hours: number;
    minutes: number;
    seconds: number;
    duration?: number;
    distance: number | undefined;
    unit: string;
    effortLevel: string;
    notes: string;
}

export type TrainingWorkout = {
    id: string;
    name: string;
    date: Date;
    dayOfWeek: string;
    tags: 'LT1' | 'LT2' | 'Hills' | 'MediumLongRun' | 'LongRun' | 'Easy' | 'Crosstrain' | 'Off';
    type: string;
    duration: string;
    targetHeartRate: string;
    targetEffortLevel: string;
    targetPace: string;
    rest?: string;
    warmup?: string;
    cooldown?: string;
    totalDistance: string;
    totalDuration: string;
    notes?: string;
}

export type TrainingWeek = {
    id: string;
    week: number;
    startDate: Date;
    endDate: Date;
    totalMileage: number;
    description?: string;
    workouts: TrainingWorkout[];
}

export type User = {
    experience: string;
    trainingDays: string[];
    currentMileage: number;
    currentRaceTime: string;
    currentRaceDistance: "Mile" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon";
    goalMileage: number;
    goalRaceTime: string;
    goalRaceDistance: "Mile" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon";
    goalRaceDate: string;
    planStartDate: string;
    numWeeks: number;
}
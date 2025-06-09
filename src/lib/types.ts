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
    name: string;
    type: string;
    dayOfWeek: string;
    tags: 'LT1' | 'LT2' | 'Hills' | 'MediumLongRun' | 'LongRun' | 'Easy' | 'Crosstrain' | 'Off';
    duration: string;
    rest?: string;
    targetHeartRate: string;
    notes?: string;
}

export type TrainingWeek = {
    week: number;
    totalMileage: number;
    description?: string;
    workouts: Workout[];
}

export type User = {
    experience: string;
    mileage: number;
    trainingDays: string[];
    raceGoalTime: string;
    raceDistance: string;
    raceDate: string;
}
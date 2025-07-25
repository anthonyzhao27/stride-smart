export type LoggedWorkout = {
    id: string;
    name: string;
    date: string;
    time: string;
    timestamp: Date;
    duration: number;
    distance?: number;
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

export type Pace = number | [number, number];

export type WorkoutSegment = WorkoutSet | { rest: number };

export type PaceEntry = {
    type: string;
    pace: Pace;
};

export type TrainingWorkout = {
  name: string;
  date: Date;
  dayOfWeek: string;
  tags:
    | 'LT1'
    | 'LT2'
    | 'Hills'
    | 'MediumLongRun'
    | 'LongRun'
    | 'Easy'
    | 'VO2Max'
    | 'RaceSpecific'
    | 'Speed'
    | 'Crosstrain'
    | 'Off';
  workout?: WorkoutSegment[];
  distance: number;
  duration: number;
  targetHeartRate?: string;
  targetPace: PaceEntry[];
  rest?: number;
  warmup?: WorkoutSegment[];
  cooldown?: string;
  notes?: string;
};

export type TrainingWeek = {
    id: string;
    week: number;
    startDate: Date;
    endDate: Date;
    totalMileage: number;
    totalDuration: number;
    description?: string;
    workouts: TrainingWorkout[];
}

export type User = {
    experience: string;
    numDaysDoubleThreshold?: number;
    trainingDays: string[];
    currentMileage: number;
    currentRaceTime: string;
    currentRaceDistance: RaceDist;
    goalMileage: number;
    goalRaceTime: string;
    goalRaceDistance: RaceDist;
    goalRaceDate: string;
    planStartDate: string;
    numWeeks: number;
}

export type WorkoutSet = {
    type: "1500" | "Mile" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon" | "LT2" | "LT1" | "Easy" | "Hills";
    reps?: number;
    duration: number;
    rest?: number;
}

export type RaceDist = "1500" | "Mile" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon"

export type TrainingDist = "1500" | "Mile" | "3K" | "5K" | "10K" | "Half Marathon" | "Marathon" | "LT1" | "LT2" | "Easy" | "Hills"

export type TrainingPaces = {
    "1500": number;
    "Mile": number;
    "3K": number;
    "5K": number;
    "10K": number;
    "Half Marathon": number;
    "Marathon": number;
    "LT1": [number, number];
    "LT2": [number, number];
    "Easy": [number, number];
    "Hills": [number, number];
}

export type WorkoutDays = {
    doubleThresholdDays?: string[];
    LT1Day?: string;
    LT2Day?: string;
    VO2RaceDay?: string;
    LongRunDay?: string;
}

export type Mileage = {
    mileage: number;
    raceSpecific: boolean;
    taper: boolean;
}
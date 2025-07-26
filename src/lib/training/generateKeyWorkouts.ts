import { User, TrainingWorkout } from "@/lib/types";
import { OpenAI } from "openai";
import { getMileageProgression } from "@/lib/training/utils/getMileageProgression";
import { assignWorkoutDays } from "./assignWorkoutDays";
import { getThresholdTimeTargets } from "./utils/getThresholdTimeTargets";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function generateKeyWorkouts( input: User, week: number): Promise<TrainingWorkout[]> {
    const mileageProgression = getMileageProgression(input);

    const raceSpecific = mileageProgression[week - 1].raceSpecific;

    const { doubleThresholdDays, LT1Day, LT2Day, HillsRaceDay, LongRunDay } = assignWorkoutDays(input, raceSpecific);
    
    const thresholds = getThresholdTimeTargets(input, week);

    const numLT1Workouts = (doubleThresholdDays ? doubleThresholdDays.length : 0) + (LT1Day ? 1 : 0);

    const numLT2Workouts = (doubleThresholdDays ? doubleThresholdDays.length : 0) + (LT2Day ? 1 : 0);

    const hasHillsRaceDay = HillsRaceDay !== undefined;
    const hasLongRunDay = LongRunDay !== undefined;
    
    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: "You are an expert distance running coach trained in the Norwegian training model."
        },
        {
            role: "user",
            content: `Create hard workouts for a week of training using Norwegian threshold training principles. Tailor the training to the runner’s experience and current fitness.
            
            - For threshold workouts, use time-based durations, not distance
            - Generate exactly ${numLT1Workouts} LT1 workouts and ${numLT2Workouts} LT2 workouts.
            ${hasHillsRaceDay && `- Generate exactly ${Number(HillsRaceDay)} ${raceSpecific ? `${input.goalRaceDistance} specific`: 'hill @5k effort'} workout.`}
            ${hasLongRunDay && `- Generate exactly ${LongRunDay ? 1 : 0} long run.
            ${input.trainingDays.length == 4 ? "- The long run should start easy and progress into LT1." : ""}`}
            - Each LT1 workout, excluding warmup and cooldown, should total ${thresholds.LT1} minutes, broken into reps of 6 or 9, or 12 min reps
            - Each LT2 workout, excluding warmup and cooldown, should total ${thresholds.LT2} minutes, broken into 3, 6, or 9 min reps.
            - Threshold workout rep to rest time should be 3:1
            - Create race pace workouts that incorporate paces faster and slower than target race pace.
            - Return workouts only — do not assign to specific days
            - Do not include easy runs or off days
            - Include warmup/cooldown for all threshold workouts
            - Provide output as an array of workouts with name, tags, and full breakdown of reps/warmups/cooldowns
            - Threshold in warmups should be a maximum of 4 minutes in total, comprising of either 1 or 2 minute reps at either LT1 or LT2 pace, with half the time of rest between reps.
            - LT2, VO2Max, and Race Specific workouts should include a threshold warmup and cooldown.
            - The easy portion of warmups and cooldown should both be at least 15 minutes long.
            - Include a maximum of 1, at most 4, reps of 3 minutes at LT1 pace in the cooldown of Hill workouts.
            - Include exactly 1 LT1 rep in the cooldown of LT2 workouts.
            `.trim()
        }];
        
        const functions = [
            {
                name: "generateHardWorkouts",
                description: "Generate structured hard workouts for the week",
                parameters: {
                    type: "object",
                    properties: {
                        workouts: {
                            type: "array",
                            description: "List of structured workouts for the week.",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string",
                                        description: "Name of the workout, including the type of workout."
                                    },
                                    tags: {
                                        type: "string",
                                        enum: ["LT1", "LT2", "Hills", "LongRun"],
                                    },
                                    workout: {
                                        type: "array",
                                        description: "The contents of the workout itself. Don't include strides.",
                                        items: {
                                            anyOf: [
                                                {
                                                    type: "object",
                                                    properties: {
                                                        type: {
                                                            type: "string",
                                                            description: "The type of interval or run segment",
                                                            enum: ["1500", "Mile", "3K", "5K", "10K", "Half Marathon", "Marathon", "LT2", "LT1", "Easy", "Hills"]
                                                        },
                                                        reps: {
                                                            type: "number",
                                                            description: "The amount of reps at the aforementioned pace"
                                                        },
                                                        duration: {
                                                            type: "number",
                                                            description: "The duration of each rep in seconds"
                                                        },
                                                        rest: {
                                                            type: "number",
                                                            description: "The duration of rest betwee each rep in seconds"
                                                        }
                                                    },
                                                    required: ["duration"]
                                                },
                                                {
                                                    type: "number",
                                                    description: "Rest period between segments in seconds"
                                                }
                                            ]
                                        }
                                    },
                                    targetHeartRate: { type: "string" },
                                    targetEffortLevel: { type: "string" },
                                    warmup: { type: "array",
                                        description: "The contents of the warmup. Don't include threshold in the warmup for LT1 workouts.",
                                        items: {
                                            anyOf: [
                                                {
                                                    type: "object",
                                                    properties: {
                                                        type: {
                                                            type: "string",
                                                            description: "The type of interval or run segment",
                                                            enum: [, "LT2", "LT1", "Easy",]
                                                        },
                                                        reps: {
                                                            type: "number",
                                                            description: "The amount of reps at the aforementioned pace"
                                                        },
                                                        duration: {
                                                            type: "number",
                                                            description: "The duration of each rep in seconds"
                                                        },
                                                        rest: {
                                                            type: "number",
                                                            description: "The duration of rest betwee each rep in seconds"
                                                        }
                                                    },
                                                    required: ["duration"]
                                                },
                                                {
                                                    type: "number",
                                                    description: "Rest period between segments in seconds"
                                                }
                                            ]
                                        }
                                    },
                                    cooldown: { type: "array",
                                        description: "The contents of the cooldown. Don't include threshold in the cooldown for LT1 workouts.",
                                        items: {
                                            anyOf: [
                                                {
                                                    type: "object",
                                                    properties: {
                                                        type: {
                                                            type: "string",
                                                            description: "The type of interval or run segment",
                                                            enum: [, "LT2", "LT1", "Easy",]
                                                        },
                                                        reps: {
                                                            type: "number",
                                                            description: "The amount of reps at the aforementioned pace"
                                                        },
                                                        duration: {
                                                            type: "number",
                                                            description: "The duration of each rep in seconds"
                                                        },
                                                        rest: {
                                                            type: "number",
                                                            description: "The duration of rest betwee each rep in seconds"
                                                        }
                                                    },
                                                    required: ["duration"]
                                                },
                                                {
                                                    type: "number",
                                                    description: "Rest period between segments in seconds"
                                                }
                                            ]
                                        } 
                                    },
                                    notes: { type: "string" },
                                },
                                required: ["name", "dayOfWeek", "tags","targetHeartRate", "targetEffortLevel", "totalDistance", "totalDuration"]
                            }
                        }
                    },
                }
            }
        ]

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

    const chatResponse  = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        functions,
        function_call: { name: 'generateHardWorkouts' },
        temperature: 0.7,
        max_tokens: 10000
    });

    const parsed = JSON.parse(chatResponse.choices[0].message.function_call?.arguments || "{}");

    return parsed.workouts ?? [];
}
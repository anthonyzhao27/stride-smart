import { User, TrainingWorkout } from "@/lib/types";
import { OpenAI } from "openai";
import { getMileageProgression } from "@/lib/plan-generation/utils/getMileageProgression";
import { assignWorkoutDays } from "@/lib/plan-generation/assignWorkoutDays";
import { getThresholdTimeTargets } from "@/lib/plan-generation/utils/getThresholdTimeTargets";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function generateKeyWorkouts( input: User, week: number): Promise<TrainingWorkout[]> {
    const mileageProgression = getMileageProgression(input);

    const raceSpecific = mileageProgression[week - 1].raceSpecific;

    const { doubleThresholdDays, LT1Day, LT2Day } = assignWorkoutDays(input, raceSpecific);
    
    const thresholds = getThresholdTimeTargets(input, week);

    const numLT1Workouts = (doubleThresholdDays ? doubleThresholdDays.length : 0) + (LT1Day ? 1 : 0);

    const numLT2Workouts = (doubleThresholdDays ? doubleThresholdDays.length : 0) + (LT2Day ? 1 : 0);
    
    const messages: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: "You are an expert distance running coach trained in the Norwegian training model."
        },
        {
            role: "user",
            content: `Create hard workouts for a week of training using Norwegian threshold training principles. Tailor the training to the runner's experience and current fitness.
            
            - For threshold workouts, use time-based durations, not distance
            - Generate exactly ${numLT1Workouts} LT1 workouts (80-83% MHR) and ${numLT2Workouts} LT2 (85-88% MHR) workouts.
            - Each LT1 workout, excluding warmup and cooldown, should total ${thresholds.LT1 * 60} seconds. All reps within a single LT1 workout must be the same duration. The allowed rep durations are exactly 360, 540, or 720 seconds. Do not mix different durations in the same workout.
            - Each LT2 workout, excluding warmup and cooldown, should total ${thresholds.LT2 * 60} seconds. All reps within a single LT2 workout must be the same duration. The allowed rep durations are exactly 180, 360, or 540 seconds. Do not mix different durations in the same workout.
            - Threshold workout rep to rest time should be 3:1
            - Return workouts only — do not assign to specific days.
            - Do not include easy runs, off days, long runs, or hill workouts (these are handled separately or removed)
            - Include warmup/cooldown for all workouts
            - Provide output as an array of workouts with name, tags, and full breakdown of reps/warmups/cooldowns
            - Threshold in warmups should be a maximum of 4 minutes in total, comprising of either 1 or 2 minute reps at either LT1 or LT2 pace, with half the time of rest between reps.
            - Threshold in warmups should be the LAST thing before the workout.
            - LT2 workouts should include a threshold warmup.
            - The easy portion of warmups and cooldown should both be at least 15 minutes long.
            - IMPORTANT: Do NOT generate any LongRun or Hills workouts - these are handled separately or removed
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
                                        enum: ["LT1", "LT2"],
                                        description: "Workout type. Do NOT include LongRun or Hills - those are handled separately or removed."
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
                                                            enum: ["1500", "Mile", "3K", "5K", "10K", "Half Marathon", "Marathon", "LT2", "LT1", "Easy"]
                                                        },
                                                        reps: {
                                                            type: "number",
                                                            description: "The amount of reps at the aforementioned pace"
                                                        },
                                                        length: {
                                                            type: "object",
                                                            description: "The length of a workout rep, either by distance or time",
                                                            properties: {
                                                                amount: {
                                                                    type: "number",
                                                                    description: "The duration, in seconds, or distance, in meters, of each rep"
                                                                },
                                                                type: {
                                                                    type: "string",
                                                                    enum: ["distance", "time"],
                                                                    description: "Whether the amount is in distance (meters) or time (seconds)"
                                                                }
                                                            },
                                                            required: ["amount", "type"],
                                                            additionalProperties: false
                                                        },
                                                        rest: {
                                                            type: "number",
                                                            description: "The duration of rest betwee each rep in seconds"
                                                        }
                                                    },
                                                    required: ["type", "length"]
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
                                                            enum: ["LT2", "LT1", "Easy",]
                                                        },
                                                        reps: {
                                                            type: "number",
                                                            description: "The amount of reps at the aforementioned pace"
                                                        },
                                                        length: {
                                                            type: "object",
                                                            description: "The length of a workout rep, either by distance or time",
                                                            properties: {
                                                                amount: {
                                                                    type: "number",
                                                                    description: "The duration, in seconds, or distance, in meters, of each rep"
                                                                },
                                                                type: {
                                                                    type: "string",
                                                                    enum: ["distance", "time"],
                                                                    description: "Whether the amount is in distance (meters) or time (seconds)"
                                                                }
                                                            },
                                                            required: ["amount", "type"],
                                                            additionalProperties: false
                                                        },
                                                        rest: {
                                                            type: "number",
                                                            description: "The duration of rest betwee each rep in seconds"
                                                        }
                                                    },
                                                    required: ["type", "length"]
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
                                required: ["name", "tags", "targetHeartRate", "targetEffortLevel"]
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
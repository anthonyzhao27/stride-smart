import { User } from "@/lib/types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAI } from "openai";
import { getMileageProgression } from "@/lib/training/utils/getMileageProgression";


export function generatePlanPrompt(input: User, week: number) : [ChatCompletionMessageParam[], OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[]] {
    const { experience, trainingDays, currentMileage, currentRaceTime, currentRaceDistance, goalMileage, goalRaceTime, goalRaceDistance, goalRaceDate, planStartDate } = input;

    
    let experienceInstructions = "";
    switch (experience) {
        case "Beginner":
            experienceInstructions = "Keep intensity low. Include mostly easy runs with at most 1 short LT1 session and one medium-long run. Include 2 rest days.";
            break;
    case "Intermediate":
            experienceInstructions = "Include 1 LT1 workout, 1 LT2 session, and a hill VO2 day, and one long run. One rest day is recommended.";
            break;
    case "Advanced":
            experienceInstructions = "Include at least one double threshold day with 2 LT1 and 2 LT2 workouts in total for the week, 1 hill sprint day, and a long run. Rest day optional.";
            break;
    }
    
    const functions = [
        {
            name: "generateTrainingWeek",
            description: "Generates a personalized training plan week using Norwegian threshold training principles.",
            parameters: {
                type: "object",
                properties: {
                    week: { type: "number", description: "The week number in the training plan." },
                    description: { type: "string", description: "Optional description of the training week." },
                    workouts: {
                        type: "array",
                        description: "List of structured workouts for the week.",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string",
                                        description: "Name of the workout, including the type of workout."
                                },
                                dayOfWeek: {
                                    type: "string",
                                    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                },
                                tags: {
                                    type: "string",
                                    enum: ["LT1", "LT2", "Hills", "MediumLongRun", "LongRun", "Easy", "Crosstrain", "Off"],
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
                                                        enum: ["1500", "3K", "5K", "10K", "Half Marathon", "Marathon", "LT2", "LT1", "Easy", "Hills"]
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
                                rest: { type: "string" },
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
            required: ["week", "workouts"]
            }
        }
    ];
    
    const messages: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content: "You are an expert distance running coach trained in the Norwegian training model."
    },
    {
        role: "user",
        content: `
            Create week ${week} of a structured training plan from ${planStartDate} to ${goalRaceDate} for a ${goalRaceDistance} runner using Norwegian threshold training principles. Tailor the training to the runner’s experience and current fitness.

            Key principles:
            - Do not include off days in the plan
            - Every day in the plan should either be an easy run or workout.
            - The training week should be ${getMileageProgression(input)[week - 1]} miles with a margin of 1 mile.
            - Max 2 LT1 (~80–83% max HR) and 2 LT2 (~85–88%) sessions per week
            - LT2 reps should be shorter and more intense than LT1
            - Include 1 hill sprint session (followed by LT1 flush)
            - Include 1 long run at easy pace
            - Easy <75% MHR
            - Use time-based durations, not distance
            - Ensure 1+ recovery day between hard sessions (LT1, LT2, hills)
            - Match weekly mileage target and respect selected training days
            - ${experienceInstructions}
            - Format: output workouts in order of training days (${trainingDays.join(", ")})
            - Record paces in miles
            - Do not include warmup and cooldown for easy runs
            - Hills should be run at 5k effort
            - Threshold in warmups should be a maximum of 4 minutes in total, comprising of either 1 or 2 minute reps at either LT1 or LT2 pace, with half the time of rest between reps.
            - LT2, VO2Max, and Race Specific workouts should include a threshold warmup and cooldown.
            - The easy portion of warmups and cooldown should be at least 10 and 15 minutes long, respectively.

            Runner profile:
            - Experience: ${experience}
            - Training days: ${trainingDays.join(", ")}
            - Current mileage: ${currentMileage} mi
            - Current race time: ${currentRaceTime} for the ${currentRaceDistance}
            - Goal mileage: ${goalMileage}
            - Goal race: ${goalRaceTime} for the ${goalRaceDistance} on ${goalRaceDate}
            `.trim()
        }
    ];



    return [messages, functions];
}
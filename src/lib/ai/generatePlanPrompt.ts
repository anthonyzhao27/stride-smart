import { User } from "@/lib/types";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAI } from "openai";
import { getTrainingPaces } from "@/lib/training/getTrainingPaces";


export function generatePlanPrompt(input: User, week: number) : [ChatCompletionMessageParam[], OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[]] {
    const { experience, trainingDays, currentMileage, currentRaceTime, currentRaceDistance, goalMileage, goalRaceTime, goalRaceDistance, goalRaceDate, planStartDate } = input;

    const { lt2Pace: currentLT2Pace, lt1Pace: currentLT1Pace, easyPace: currentEasyPace} = getTrainingPaces(currentRaceDistance, currentRaceTime);
    
    const { m1500Pace: goal1500mPace, m3000Pace: goal3KPace, m5000Pace: goal5KPace, m10000Pace: goal10KPace, lt2Pace: goalLT2Pace, lt1Pace: goalLT1Pace, easyPace: goalEasyPace } = getTrainingPaces(goalRaceDistance, goalRaceTime);

    const currentTrainingPaces = `LT1: ${currentLT1Pace}, LT2: ${currentLT2Pace}, Easy: ${currentEasyPace}`;
    const goalTrainingPaces = `LT1: ${goalLT1Pace}, LT2: ${goalLT2Pace}, Easy: ${goalEasyPace}`;
    const goalRacePaces = `1500m: ${goal1500mPace}, 3K: ${goal3KPace}, 5K: ${goal5KPace}, 10K: ${goal10KPace}`;

    
    let experienceInstructions = "";
    switch (experience) {
        case "beginner":
            experienceInstructions = "Keep intensity low. Include mostly easy runs with at most 1 short LT1 session. Include 2 rest days.";
            break;
    case "intermediate":
            experienceInstructions = "Include 1–2 LT1 workouts, 1 LT2 session, and a hill sprint day. One rest day is recommended.";
            break;
    case "advanced":
            experienceInstructions = "Include 2 LT1, 2 LT2 workouts, 1 hill sprint day, and a medium-long run. Rest day optional.";
            break;
    }
    
    const functions = [
        {
            name: "generateTrainingWeek",
            description: "Generates a personalized 5K training plan week using Norwegian threshold training principles.",
            parameters: {
                type: "object",
                properties: {
                    week: { type: "number", description: "The week number in the training plan." },
                    totalMileage: { type: "number", description: "Total weekly mileage." },
                    startDate: { type: "string", format: "date", description: "Start date of the training week." },
                    endDate: { type: "string", format: "date", description: "End date of the training week." },
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
                                type: { type: "string",
                                    enum: ["LT1", "LT2", "Hills", "MediumLongRun", "LongRun", "Easy", "Crosstrain", "Off"]
                                 },
                                duration: { type: "string" },
                                targetHeartRate: { type: "string" },
                                targetEffortLevel: { type: "string" },
                                targetPace: { type: "string" },
                                rest: { type: "string" },
                                warmup: { type: "string" },
                                cooldown: { type: "string" },
                                totalDistance: { type: "string" },
                                totalDuration: { type: "string" },
                                notes: { type: "string" },
                                },
                                required: ["name", "date", "dayOfWeek", "tags", "type", "duration", "targetHeartRate", "targetEffortLevel", "targetPace", "totalDistance", "totalDuration"]
                        }
                    }
                },
            required: ["week", "totalMileage", "workouts"]
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

            Pacing and mileage guidance:
            - Use ${currentTrainingPaces} as the baseline for LT1, LT2, and Easy, respectively and gradually progress toward ${goalTrainingPaces} by ${goalRaceDate}. Always include the pace range for LT1, LT2, and Easy.
            - Use ${currentMileage} as the starting point and gradually increase to ${goalMileage} by ${goalRaceDate}.
            - This is week ${week}, so use paces proportionally closer to the current or goal depending on how far along the plan is.
            - For race specific work, use the following paces: ${goalRacePaces}.

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
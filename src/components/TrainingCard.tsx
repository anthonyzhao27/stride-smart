import { TrainingWorkout, WorkoutSet, WorkoutSegment } from '@/lib/types';
import { useState } from "react";
import { formatPace } from "@/lib/training/utils/getTrainingPaces";
import { ChevronDown, ChevronUp } from "lucide-react";
import { secToMin } from "@/lib/conversion";

const tagColorMap: Record<TrainingWorkout['tags'], string> = {
    LT1: 'bg-yellow-100 text-yellow-800',
    LT2: 'bg-red-100 text-red-800',
    Hills: 'bg-green-100 text-green-800',
    MediumLongRun: 'bg-blue-100 text-blue-800',
    LongRun: 'bg-purple-100 text-purple-800',
    Easy: 'bg-gray-100 text-gray-800',
    Crosstrain: 'bg-orange-100 text-orange-800',
    Off: 'bg-zinc-100 text-zinc-500',
    VO2Max: 'bg-teal-100 text-teal-800',
    RaceSpecific: 'bg-pink-100 text-pink-800',
    Speed: 'bg-indigo-100 text-indigo-800',
};

function isWorkoutSet(item: WorkoutSet | WorkoutSegment | number): item is WorkoutSet {
    return typeof item === "object" && item !== null && "type" in item && "duration" in item;
}

function isWorkoutSegment(item: WorkoutSet | WorkoutSegment | number): item is WorkoutSegment {
    return typeof item === "object" && item !== null && "rest" in item && !("type" in item);
}

export function WorkoutDetails( { workout }: { workout: WorkoutSegment[] }) {
    return (
        <div className="flex flex-col items-end">
            {workout.map((item, idx) => {
                if (isWorkoutSet(item)) {
                    return (
                        <div key={idx} className="text-sm">
                            {item.reps ? (item.reps !== 1 ? `${item.reps}x` : "") : ""}
                            {item.duration >= 60 ? secToMin(item.duration) : `${item.duration}s`} @ {item.type}
                            {item.rest !== undefined
                                ? ` w/ ${item.rest >= 60 ? secToMin(item.rest) : `${item.rest}s`} rest`
                                : ""}
                        </div>
                    );
                } else if (isWorkoutSegment(item)) {
                    return (
                        <div key={idx} className="text-sm">
                            Rest {item.rest >= 60 ? secToMin(item.rest) : `${item.rest}s`}
                        </div>
                    );
                } else {
                    return (
                        <div key={idx} className="text-sm">
                            Rest {typeof item === "number" ? secToMin(item) : "N/A"}
                        </div>
                    );
                }
            })}
        </div>
    );
}

export default function TrainingCard({ workout }: { workout: TrainingWorkout }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="p-4 space-y-4 transition-all duration-300 ease-in-out bg-white border border-gray-200 shadow-sm rounded-2xl dark:border-gray-700 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{workout.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{workout.dayOfWeek}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tagColorMap[workout.tags]}`}>
                    {workout.tags}
                </span>
            </div>

            {/* Key Workout Details */}
            <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                {/* Workout block */}
                {workout.workout && !["LongRun", "MediumLongRun", "Easy"].includes(workout.tags) && (
                    <div className="flex justify-between">
                        <span className="font-medium">Workout:</span>
                        <WorkoutDetails workout={workout.workout} />
                    </div>
                )}

                {/* Metrics */}
                <div className="flex justify-between">
                    <span className="font-medium">Target HR:</span>
                    <span>{workout.targetHeartRate}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Target Pace:</span>
                    <div className="flex flex-col items-end">
                        {Array.isArray(workout.targetPace) &&
                            workout.targetPace.map((entry, idx) => {
                                const type = entry.type;
                                const pace = entry.pace;
                                return (
                                    <span key={idx}>
                                        {type}: {typeof pace === "number" ? formatPace(pace) : (`${formatPace(pace[0]).slice(0, -7)} - ${formatPace(pace[1])}`)}
                                    </span>
                                );
                            })}
                    </div>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Total Distance:</span>
                    <span>{workout.distance}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-medium">Total Duration:</span>
                    <span>{secToMin(workout.duration)}</span>
                </div>
            </div>

            {workout.warmup && workout.cooldown &&
                <>
                    {/* Expandable Section */}
                    {expanded && (
                        <div className="pt-4 space-y-2 text-sm text-gray-700 border-t border-gray-200 dark:text-gray-300 dark:border-gray-700">
                            <div className="flex justify-between">
                                <span className="font-medium">Warmup:</span>
                                {workout.warmup && (
                                    <WorkoutDetails workout={workout.warmup} />
                                )}
                            </div>

                            {workout.cooldown &&
                                <div className="flex justify-between">
                                    <span className="font-medium">Cooldown:</span>
                                    <span>
                                        {workout.cooldown}
                                    </span>
                                </div>
                            }

                            {workout.notes && (
                                <div>
                                    <span className="block mb-1 font-medium">Notes:</span>
                                    <p>{workout.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expand Button */}
                    <div className="pt-2">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center justify-center w-full gap-1 text-sm font-medium text-gray-400 dark:text-blue-400 hover:underline focus:outline-none"
                        >
                            {expanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    </div>
                </>
            }
        </div>
    );
}

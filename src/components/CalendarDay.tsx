import { TrainingWorkout, LoggedWorkout } from '@/lib/types';

type Props = {
    day: Date;
    workouts: TrainingWorkout[] | LoggedWorkout[];
};

export default function CalendarDay({ day, workouts }: Props) {
    const isToday = day.toDateString() === new Date().toDateString();

    const getTagColor = (tag: string | undefined) => {
        switch (tag) {
            case "Run":
                return "bg-yellow-500";
            case "Bike":
                return "bg-orange-500";
            case "Swim":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div
            className={`relative p-2 bg-white dark:bg-gray-900 transition-all ease-in-out duration-200 ${
                isToday ? "ring-2 ring-indigo-500 z-10" : ""
            }`}
        >
            {/* Header: Date + Today tag */}
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {day.getDate()}
                </span>
                {isToday && (
                    <span className="text-xs px-1 py-0.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white rounded">
                        Today
                    </span>
                )}
            </div>

            {/* Workouts */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80%] pr-1">
                {workouts.length > 0 ? (
                    workouts.map((w, i) => (
                        <div
                            key={i}
                            title={w.notes || w.name}
                            className={`px-2 py-1 rounded-md text-xs text-white font-medium truncate ${getTagColor('type' in w ? w.type : undefined)}`}
                        >
                            {w.name}
                        </div>
                    ))
                ) : (
                    <span className="text-[10px] text-gray-400 italic">
                        No workout
                    </span>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { getStartofCalendarMonth, getDaysForCalendar } from '@/lib/calendarUtils';
import { fetchWorkoutsForMonth } from '@/lib/firebaseUtils';
import CalendarDay from './CalendarDay';
import { TrainingWorkout, LoggedWorkout } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export default function Calendar() {
    const [calendarDays, setCalendarDays] = useState<Date[]>([]);
    const [workouts, setWorkouts] = useState<Record<string, LoggedWorkout[]>>({});
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const today = new Date();
        const startOfMonth = getStartofCalendarMonth(today);
        const days = getDaysForCalendar(startOfMonth);
        setCalendarDays(days);

        fetchWorkoutsForMonth(startOfMonth, user.uid)
            .then(setWorkouts)
            .catch((error) => console.error("Error fetching workouts:", error));
    }, [user]);

    return (
        <div className="w-screen pl-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 h-[calc(100vh-4rem)]">
            <div className="h-full overflow-hidden shadow-inner ring-gray-300 dark:ring-gray-700">
            <div className="grid h-full grid-cols-7 grid-rows-6 gap-px bg-gray-300 dark:bg-gray-700">
                {calendarDays.map((day) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                    <div
                    key={day.toISOString()}
                    className={`relative p-2 bg-white dark:bg-gray-900 transition-all ease-in-out duration-200 ${
                        isToday ? "ring-2 ring-indigo-500 z-10" : ""
                    }`}
                    >
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
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80%] pr-1">
                        {(workouts[day.toDateString()] || []).map((workout, i) => (
                        <div
                            key={i}
                            className={`px-2 py-1 rounded-md text-xs text-white font-medium truncate
                            ${
                                workout.type === "Run"
                                ? "bg-yellow-500"
                                : workout.type === "Swim"
                                ? "bg-orange-500"
                                : workout.type === "Bike"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                            }
                            `}
                        >
                            {workout.name}
                        </div>
                        ))}
                        {!(workouts[day.toDateString()] || []).length && (
                        <span className="text-[10px] text-gray-400 italic">
                            No workout
                        </span>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
            </div>
        </div>
    );
}

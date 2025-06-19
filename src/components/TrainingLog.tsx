'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { TrainingWeek, TrainingWorkout } from '@/lib/types';
import TrainingCard from './TrainingCard';

export default function TrainingLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<TrainingWeek[]>([]);
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        if (!user) return;
        
        const fetchTrainingLogs = async () => {
            try {
                const logsRef = collection(db, 'users', user.uid, 'plans');
                const logsQuery = query(logsRef, orderBy('week', 'asc'));
                const querySnapshot = await getDocs(logsQuery);
                const logsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        week: data.week,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        totalMileage: data.totalMileage,
                        description: data.description || '',
                        workouts: data.workouts as TrainingWorkout[] || []
                    } as TrainingWeek;
                });
                setLogs(logsData);
            } catch (error) {
                console.error("Error fetching training logs:", error);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTrainingLogs();
    }, [user]);

    if (loading) return <p className="text-center">Loading training logs...</p>;

    const formatDate = (date: Date) => {
        return `${String(date.getMonth() + 1)}/${String(date.getDate() + 1).padStart(2, "0")}`;
    }

    console.log("Training logs fetched:", logs);
    return (
        <main className="min-h-screen pl-0 bg-gradient-to-br from-blue-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
            <div className="p-6 mx-auto max-w-screen-2xl">
                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
                    Training Log
                    </h1>
                </div>

                {/* No Logs */}
                {logs.length === 0 ? (
                    <div className="p-6 text-center text-gray-600 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-300">
                    <p>No training logs yet. Get moving!</p>
                    </div>
                ) : (
                    logs.flatMap((log, logIndex) => [
                        <h1 key={`heading-${logIndex}`} className="my-4 text-2xl font-bold">
                            Week {log.week}:  {formatDate(new Date(log.startDate))} - {formatDate(new Date(log.endDate))}
                        </h1>,
                        <div
                            key={`grid-${logIndex}`}
                            className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] animate-fade-in"
                        >
                            {log.workouts.map((workout, workoutIndex) => (
                            <TrainingCard
                                key={`workout-${logIndex}-${workoutIndex}`}
                                workout={workout}
                            />
                            ))}
                        </div>,
                    ])
                )}
            </div>
        </main>
    );
}
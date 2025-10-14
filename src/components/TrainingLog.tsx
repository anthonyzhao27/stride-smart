'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { TrainingWeek } from '@/domain/types';
import { secToMin } from "@/lib/conversion";
import TrainingCard from './TrainingCard';

export default function TrainingLog() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<TrainingWeek[]>([]);
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        const fetchTrainingLogs = async () => {
            try {
                type PlanRecord = { planId: string; plan: unknown };
                const resp = await apiClient.get<{ ok: boolean; plans: Array<PlanRecord> }>(`/plans`);
                const plans = (resp?.plans || []).map((p: PlanRecord) => ({ id: p.planId, ...(p.plan as object) }));
                if (!cancelled) setLogs(plans as unknown as TrainingWeek[]);
            } catch (error) {
                console.error("Error fetching training logs:", error);
                if (!cancelled) setLogs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchTrainingLogs();
        return () => { cancelled = true; };
    }, [user]);

    if (loading) return <p className="text-center">Loading training logs...</p>;

    const formatDate = (date: Date) => {
        return `${String(date.getMonth() + 1)}/${String(date.getDate()).padStart(2, "0")}`;
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
                        <div key={`heading-${logIndex}`} className="flex items-center justify-between my-4">
                            <h1 className="text-2xl font-bold">
                                Week {log.week}: {formatDate(log.startDate)} - {formatDate(log.endDate)}
                            </h1>
                            <div className="text-sm text-right text-gray-600 dark:text-gray-400">
                                <div>Total Distance: {log.totalMileage} mi</div>
                                <div>Total Duration: {secToMin(log.totalDuration)}</div>
                            </div>
                        </div>,
                        <div
                            key={`grid-${logIndex}`}
                            className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] animate-fade-in"
                        >
                            {log.workouts.map((workout, workoutIndex) => (
                                <TrainingCard key={`workout-${logIndex}-${workoutIndex}`} workout={workout} />
                            ))}
                        </div>,
                    ])
                )}
            </div>
        </main>
    );
}
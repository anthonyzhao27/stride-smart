'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { LoggedWorkout, FormData } from '@/domain/types';
import WorkoutForm from './WorkoutForm';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from "@/context/AuthContext";
import WorkoutCard from '@/components/WorkoutCard';
import OnboardingModal from '@/components/OnboardingModal';
import TrainingCard from '@/components/TrainingCard';
import MileageChart from '@/components/MileageChart';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [workouts, setWorkouts] = useState<LoggedWorkout[]>([]);
    const [showForm, setShowForm] = useState(false);
    type WorkoutWithFormData = { id: string } & Partial<FormData>;
    const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithFormData | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const router = useRouter();
    
    const { user, loading } = useAuth();
    const uid = user?.uid;   
    
    useEffect(() => {
        if (user === null) {
            router.push("/login")
        }
    }, [user, router]);

    function convertWorkoutToFormData(workout: LoggedWorkout): Partial<FormData> {

        const hours = Math.floor(workout.duration / 3600);
        const minutes = Math.floor((workout.duration % 3600) / 60);
        const seconds = workout.duration % 60;

        return {
            name: workout.name,
            type: workout.type,
            date: workout.date,
            time: workout.time,
            timestamp: new Date(`${workout.date}T${workout.time}`),
            hours,
            minutes,
            seconds,
            duration: workout.duration,
            distance: workout.distance,
            unit: workout.unit,
            effortLevel: workout.effortLevel,
            notes: workout.notes,
        };
    }


    const handleEdit = (workout: LoggedWorkout) => {
        const formDataDefaults = convertWorkoutToFormData(workout);
        setSelectedWorkout({ id: workout.id, ...formDataDefaults });
        setShowForm(true);
    }

    const handleOpenForm = () => setShowForm(true);


    useEffect(() => {
        const checkOnboarding = async () => {
            if (loading || !uid) return;
            try {
                const resp = await apiClient.get<{ ok: boolean; profile?: unknown }>(`/onboarding`);
                setShowOnboarding(!(resp && resp.ok && resp.profile));
            } catch {
                // Most likely not authenticated yet
                setShowOnboarding(true);
            }
        };

        checkOnboarding();
    }, [uid, loading]);

    useEffect(() => {
        if (loading || !uid) return;
        let isCancelled = false;

        const fetchWorkouts = async () => {
            try {
                const data = await apiClient.get<{ workouts: LoggedWorkout[] }>(`/workouts`);
                if (!isCancelled) {
                    const normalized = (data?.workouts || []).map((w) => ({
                        ...w,
                        timestamp: (w.timestamp instanceof Date) ? w.timestamp : new Date(w.timestamp as unknown as string),
                    }));
                    setWorkouts(normalized);
                }
            } catch (e) {
                console.error('Error fetching workouts:', e);
                // Do not open onboarding here; only show onboarding based on explicit onboarding fetch
                // Optionally handle unauthorized by redirecting to login
                if (e instanceof Error && e.message.includes('Unauthorized')) {
                    router.push('/login');
                }
            }
        };

        fetchWorkouts();
        const interval = setInterval(fetchWorkouts, 30000);
        return () => { isCancelled = true; clearInterval(interval); };
    }, [uid, loading]);

    const handleDelete = async (id: string) => {
        if (!uid) return;
        try {
            await apiClient.delete(`/workouts/${id}`);
        } catch (error) {
            console.error("Error deleting workout:", error);
        }
    };

    const WorkoutButton = () => {
        return (
            <>
                <button
                    onClick={handleOpenForm}
                    className="fixed z-50 flex items-center justify-center w-16 h-16 text-white transition-all duration-300 transform rounded-full shadow-lg bottom-6 right-6 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 focus:outline-none ring-2 ring-green-300 dark:ring-green-700"
                    aria-label="Add workout"
                    >
                    <FaPlus className="text-2xl text-white" />
                </button>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black bg-opacity-50 backdrop-blur-sm">
                        <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800 animate-fade-in">
                        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">{selectedWorkout ? "Edit Workout" : "Add a new workout"}</h1>
                            <WorkoutForm
                                defaultValues={selectedWorkout ?? undefined}
                                selectedWorkout={selectedWorkout ?? undefined}
                                onClose={() => {
                                    setShowForm(false);
                                    setSelectedWorkout(null);
                                }}
                            />
                        </div>
                    </div>
                )}
            </>
        );
    };

    const OnboardingForm = () => {
        return (
            <>
                {showOnboarding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                        <OnboardingModal
                            onClose={() => setShowOnboarding(false)}
                            onSubmit={() => setShowOnboarding(false)}
                        />
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            <OnboardingForm />
            <main className="min-h-screen pl-0 bg-gradient-to-br from-blue-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
                {/* Training Overview */}
                <div className="grid items-start gap-6 p-6 mx-auto mb-12 max-w-screen-2xl lg:grid-cols-2 animate-fade-in">
                {/* Column 1: Upcoming Workout */}
                <div className="flex flex-col space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
                    Upcoming Workout
                    </h1>
                    <div className="flex-1 min-h-[350px] h-full flex flex-col">
                        <TrainingCard
                            workout={{
                            name: '8x1k Cruise Intervals',
                            date: new Date('2025-06-15'),
                            dayOfWeek: 'Tuesday',
                            tags: 'LT2',
                            distance: 9,
                            duration: 70,
                            targetHeartRate: '160–170 bpm',
                            targetPace: [{ type: 'LT2', pace: [6.0, 6.2] }],
                            warmup: [{ type: 'Easy', length: { amount: 15, type: 'time' } }],
                            cooldown: '15 min',
                            notes: 'Keep pace controlled. This is not a VO2 max session.',
                            }}
                        />
                    </div>
                </div>

                {/* Column 2: Mileage Chart */}
                <div className="flex flex-col space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
                    Mileage
                    </h1>
                    <div className="flex-1 min-h-[350px] h-full bg-white border border-gray-200 shadow-sm rounded-2xl dark:border-gray-700 dark:bg-gray-900 p-6 flex flex-col">
                        <MileageChart />
                    </div>
                </div>
                </div>

                <div className="p-6 mx-auto max-w-screen-2xl">
                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
                            Recent Workouts
                        </h1>
                    </div>
                    {/* Workouts Grid */}
                    {workouts.length === 0 ? (
                    <div className="p-6 text-center text-gray-600 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-300">
                        <p>No workouts yet. Get moving!</p>
                    </div>
                    ) : (
                    <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] animate-fade-in">
                        {workouts.slice(0, 6).map((workout, idx) => (
                            <WorkoutCard
                                key={`${workout.id}-${idx}`}
                                workout={workout}
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                    )}

                    {/* Add Workout Button */}
                    <div className="flex justify-center mt-10">
                        <WorkoutButton />
                    </div>
                </div>
            </main>
        </>
    );
}

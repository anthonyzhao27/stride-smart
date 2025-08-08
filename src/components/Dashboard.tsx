'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { query, orderBy, collection, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { LoggedWorkout, FormData } from '@/lib/types';
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
    
    const { user } = useAuth();
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
            if (!uid) return;
            
            const onboardingRef = doc(db, "users", uid, "onboardingData", "profile");
            const onboardingSnap = await getDoc(onboardingRef);

            setShowOnboarding(!onboardingSnap.exists());
        };

        checkOnboarding();
    }, [uid]);

    useEffect(() => {
        if (!uid) return;

        const q = query(
            collection(db, "users", uid, "workouts"),
            orderBy("timestamp", "desc")
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const workoutsData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const ts = data.timestamp.toDate();
                    
                    return {
                        id: doc.id,
                        name: data.name,
                        timestamp: ts,
                        date: ts.toISOString().split("T")[0],
                        time: `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`,
                        duration: data.duration,
                        distance: data.distance,
                        unit: data.unit,
                        type: data.type,
                        effortLevel: data.effortLevel,
                        notes: data.notes,
                    } as LoggedWorkout;
                });
                setWorkouts(workoutsData);
            },
            (error) => {
                console.error("Error fetching workouts:", error);
            }
        );

        return () => unsubscribe();
    }, [uid]);

    const handleDelete = async (id: string) => {
        if (!uid) return;
        
        try {
            await deleteDoc(doc(db, "users", uid, "workouts", id));
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
                            id: 'upcoming-workout',
                            name: '8x1k Cruise Intervals',
                            date: new Date('2025-06-15'),
                            dayOfWeek: 'Tuesday',
                            tags: 'LT2',
                            type: 'Cruise Intervals',
                            duration: "5x6 min",
                            targetHeartRate: '160–170 bpm',
                            targetEffortLevel: 'Hard',
                            targetPace: '6:00-6:20/mi',
                            rest: '90s jog',
                            warmup: '15 min jog',
                            cooldown: '15 min',
                            totalDistance: '9 mi',
                            totalDuration: '70 min',
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
                        {workouts.slice(0, 6).map((workout) => (
                            <WorkoutCard
                                key={workout.id}
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

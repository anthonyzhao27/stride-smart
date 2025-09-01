'use client';

import {db} from '../lib/firebase';
import { addDoc, collection, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { getAuth } from 'firebase/auth';
import { FormData } from "@/lib/types";

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTodayTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};




export default function WorkoutForm({
    defaultValues,
    onClose,
    selectedWorkout,
}: {
    defaultValues?: Partial<FormData>;
    onClose: () => void;
    selectedWorkout?: {id: string} & Partial<FormData>;
}) {

    console.log("🎯 Default form values:", defaultValues);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors }
    } = useForm<FormData>({
        defaultValues: {
            date: getTodayDate(),
            time: getTodayTime(),
            unit: 'mi',
            ...defaultValues,
        }
    });

    const auth = getAuth();
    const uid = auth.currentUser?.uid;

    if (!uid) {
        console.error("User is not authenticated");
        return null; // or handle the error appropriately
    }

    const distance = watch('distance');
    const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const regex = /^(0|[1-9]\d*)(\.\d{0,2})?$/;

        if (value === '') {
            setValue('distance', undefined);
            return;
        }

        if (regex.test(value)) {
            setValue('distance', parseFloat(value));
        }
    };

    const workoutType = watch('type');

    const onSubmit = async (data: FormData) => {
        if (!data.name) {
            const hour = parseInt(data.time.split(':')[0], 10);
            let tod = "Night";
            if (hour >= 20) {
                tod = "Night";
            } else if (hour >= 18) {
                tod = "Evening";
            } else if (hour >= 14) {
                tod = "Afternoon";
            } else if (hour >= 11) {
                tod = "Lunch";
            } else if (hour >= 5) {
                tod = "Morning";
            }
            data.name = `${tod} ${data.type}`;
        }

        const {hours, minutes, seconds, date, time, ...rest} = data;

        const duration = (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60) + Number(seconds || 0);

        const timestamp = new Date(`${date}T${time}`);

        const finalData = {
            ...rest,
            duration,
            timestamp,
            createdAt: Timestamp.now(),
        }


        console.log('🚀 Form is submitting:', data);
        try {
            if (!db) {
                console.error("Firestore not available");
                return;
            }

            if (selectedWorkout) {
                const docRef = doc(db, "users", uid, "workouts", selectedWorkout.id);
                await updateDoc(docRef, {
                    ...finalData,
                    updatedAt: Timestamp.now(),
                });
                console.log("Workout updated");
            } else {
                await addDoc(collection(db, "users", uid, "workouts"), finalData);
                console.log("Workout added to Firestore");
            }
            reset();
            onClose();
        } catch (error) {
            console.error("❌ Error adding workout:", error);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="relative max-w-md mx-auto space-y-4">
                {/* Name */}
                <input
                type="text"
                placeholder="Name"
                {...register('name')}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}

                {/* Workout Type */}
                <select
                {...register('type', { required: true })}
                defaultValue=""
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                <option value="" disabled>Workout type</option>
                <option value="Run">Running</option>
                <option value="Bike">Cycling</option>
                <option value="Swim">Swimming</option>
                <option value="Gym">Strength Training</option>
                <option value="Yoga">Yoga</option>
                </select>

                {/* Date and Time */}
                <div className="flex gap-4">
                <input
                    type="date"
                    {...register('date', { required: true })}
                    className="w-1/2 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                    type="time"
                    {...register("time", { required: true })}
                    className="w-1/2 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                    <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Duration</h3>
                    <div className="flex items-start gap-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center">
                            <input
                                type="number"
                                placeholder="HH"
                                {...register("hours", { valueAsNumber: true, min: 0, max: 24 })}
                                className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="h-5 text-sm text-red-500">{errors.hours ? "Invalid hours" : ""}</p>
                        </div>

                        {/* Colon */}
                        <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center">
                            <input
                                type="number"
                                placeholder="MM"
                                {...register("minutes", { valueAsNumber: true, min: 0, max: 59 })}
                                className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="h-5 text-sm text-red-500">{errors.minutes ? "Invalid minutes" : ""}</p>
                        </div>

                        {/* Colon */}
                        <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center">
                            <input
                                type="number"
                                placeholder="SS"
                                {...register("seconds", { valueAsNumber: true, min: 0, max: 59 })}
                                className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="h-5 text-sm text-red-500">{errors.seconds ? "Invalid seconds" : ""}</p>
                        </div>
                    </div>
                
                    {(workoutType === 'Run' || workoutType === 'Bike') && (
                        <>
                            {/* Distance + Unit */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={distance !== undefined ? String(distance) : ''}
                                    placeholder="Distance"
                                    onChange={handleDistanceChange}
                                    onPaste={(e) => {
                                    const pasted = e.clipboardData.getData('text').trim();
                                    const regex = /^(0|[1-9]\d*)(\.\d{0,2})?$/;
                                    if (!regex.test(pasted)) e.preventDefault();
                                    }}
                                    className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input type="hidden" {...register('distance', { required: "Distance is required" })} />
                                <Controller
                                    name="unit"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <select
                                        {...field}
                                        onChange={(e) => {
                                            // Just update the unit, no conversion
                                            field.onChange(e);
                                        }}
                                        className="w-24 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                        <option value="mi">mi</option>
                                        <option value="km">km</option>
                                        </select>
                                    )}
                                />
                            </div>
                        </>
                    )}

                </div>

                {/* Effort */}
                <select
                {...register('effortLevel', { required: true })}
                defaultValue=""
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                <option value="" disabled>Effort Level</option>
                <option value="Very light">Very light</option>
                <option value="Light">Light</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
                <option value="Very Hard">Very hard</option>
                <option value="All Out">All out</option>
                </select>

                {/* Notes */}
                <textarea
                placeholder="Notes"
                {...register('notes')}
                className="w-full h-32 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md resize-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                ></textarea>

                {/* Submit */}
                <button
                type="submit"
                className="px-4 py-2 text-white transition duration-200 bg-green-600 rounded-md hover:bg-green-700"
                >
                Save workout
                </button>
            </form>

            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute text-xl text-gray-500 top-2 right-4 hover:text-green-600 dark:hover:text-green-300"
            >
                &times;
            </button>
        </>
    )
}

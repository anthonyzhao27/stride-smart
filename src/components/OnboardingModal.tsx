'use client';

import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OnboardingModal({
    isOpen,
    onClose,
    onSubmit,
    }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: User) => void;
    }) {
    const { user } = useAuth();
    const uid = user?.uid;
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<User & {
        currentHours: number;
        currentMinutes: number;
        currentSeconds: number;
        goalHours: number;
        goalMinutes: number;
        goalSeconds: number;
    }>({
        defaultValues: {
            planStartDate: new Date().toISOString().split('T')[0],
        },
    });

    const onFormSubmit = async (data: User & {
        currentHours: number;
        currentMinutes: number;
        currentSeconds: number;
        goalHours: number;
        goalMinutes: number;
        goalSeconds: number;
    })=> {
        if (!uid) return;

        function formatTime(h?: number, m?: number, s?: number): string {
            const pad = (n: number) => n.toString().padStart(2, "0");

            const hours = !Number.isNaN(h) && h !== null ? Number(h) : 0;
            const minutes = !Number.isNaN(m) && m !== null ? Number(m) : 0;
            const seconds = !Number.isNaN(s) && s !== null ? Number(s) : 0;

            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }

        function getWeeksBetweenDates(startDateStr: string, endDateStr: string): number {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            // Get difference in milliseconds
            const diffInMs = endDate.getTime() - startDate.getTime();

            // Convert milliseconds to weeks
            const msInWeek = 1000 * 60 * 60 * 24 * 7;
            const diffInWeeks = diffInMs / msInWeek;

            return Math.floor(diffInWeeks); // use Math.ceil if you want to round up
        }
        
          const orderedTrainingDays = daysOfWeek.filter((day) => data.trainingDays.includes(day));

        
        const payload: User = {
            experience: data.experience,
            trainingDays: orderedTrainingDays,
            currentMileage: data.currentMileage,
            currentRaceTime: formatTime(data.currentHours, data.currentMinutes, data.currentSeconds),
            currentRaceDistance: data.currentRaceDistance,
            goalMileage: data.goalMileage,
            goalRaceTime: formatTime(data.goalHours, data.goalMinutes, data.goalSeconds),
            goalRaceDistance: data.goalRaceDistance,
            goalRaceDate: data.goalRaceDate,
            planStartDate: data.planStartDate,
            numWeeks: getWeeksBetweenDates(data.planStartDate, data.goalRaceDate),
        };

        try {
            await setDoc(doc(db, "users", uid, "onboardingData", "profile"), payload);
            
            onSubmit(payload);
            onClose();

            await fetch("/api/generatePlan", {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ uid, user: payload }),
            });
            
        } catch (err) {
            console.error("Error during onboarding:", err);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md p-6 space-y-4 bg-white shadow-xl rounded-2xl dark:bg-gray-900">
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                    Tell us about your training
                </Dialog.Title>

                <form onSubmit={handleSubmit(onFormSubmit)} className="max-h-[80vh] pr-1 space-y-4 overflow-y-auto">
                    {/* Experience */}
                    <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        Experience Level
                    </label>
                    <select
                        {...register('experience', { required: true })}
                        className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">Select experience</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                    {errors.experience && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Current weekly mileage */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Current Weekly Mileage
                        </label>
                        <input
                            type="number"
                            step="any"
                            min={0}
                            {...register('currentMileage', { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                            placeholder="e.g. 25"
                        />
                        {errors.currentMileage && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Goal weekly mileage */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Goal Weekly Mileage
                        </label>
                        <input
                            type="number"
                            step="any"
                            min={0}
                            {...register('goalMileage', { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                            placeholder="e.g. 25"
                        />
                        {errors.goalMileage && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Training days */}
                    <div>
                        <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Days You Can Train
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                        {daysOfWeek.map((day) => (
                            <label
                                key={day}
                                className="flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                            <input
                                type="checkbox"
                                value={day}
                                {...register('trainingDays')}
                                className="form-checkbox"
                            />
                            {day}
                            </label>
                        ))}
                        </div>
                    </div>

                    {/* Current time */}
                    <div className="space-y-1">
                        <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Current Time
                        </h3>
                        <div className="flex items-start gap-4">
                            {/* Hours */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="HH"
                                    {...register('currentHours', { valueAsNumber: true, min: 0, max: 24 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.currentHours ? 'Invalid' : ''}
                                </p>
                            </div>

                            {/* Colon */}
                            <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                            {/* Minutes */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="MM"
                                    {...register('currentMinutes', { valueAsNumber: true, min: 0, max: 59 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.currentMinutes ? 'Invalid' : ''}
                                </p>
                            </div>

                            <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                            {/* Seconds */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="SS"
                                    {...register('currentSeconds', { valueAsNumber: true, min: 0, max: 59 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.currentSeconds ? 'Invalid' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Current Race Distance
                        </label>
                        <select
                            {...register("currentRaceDistance", { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select distance</option>
                            <option value="Mile">Mile</option>
                            <option value="3K">3K</option>
                            <option value="5K">5K</option>
                            <option value="10K">10K</option>
                            <option value="Half Marathon">Half Marathon</option>
                            <option value="Marathon">Marathon</option>
                        </select>
                        {errors.currentRaceDistance && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Goal time */}
                    <div className="space-y-1">
                        <h3 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Goal Time
                        </h3>
                        <div className="flex items-start gap-4">
                            {/* Hours */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="HH"
                                    {...register('goalHours', { valueAsNumber: true, min: 0, max: 24 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.goalHours ? 'Invalid' : ''}
                                </p>
                            </div>

                            {/* Colon */}
                            <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                            {/* Minutes */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="MM"
                                    {...register('goalMinutes', { valueAsNumber: true, min: 0, max: 59 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.goalMinutes ? 'Invalid' : ''}
                                </p>
                            </div>

                            <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                            {/* Seconds */}
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    placeholder="SS"
                                    {...register('goalSeconds', { valueAsNumber: true, min: 0, max: 59 })}
                                    className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="h-5 text-sm text-red-500">
                                    {errors.goalSeconds ? 'Invalid' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Goal Race Distance
                        </label>
                        <select
                            {...register("goalRaceDistance", { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select distance</option>
                            <option value="Mile">Mile</option>
                            <option value="3K">3K</option>
                            <option value="5K">5K</option>
                            <option value="10K">10K</option>
                            <option value="Half Marathon">Half Marathon</option>
                            <option value="Marathon">Marathon</option>
                        </select>
                        {errors.goalRaceDistance && <p className="text-sm text-red-500">Required</p>}
                    </div>


                    {/* Race date */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Race Date
                        </label>
                        <input
                            type="date"
                            {...register('goalRaceDate', { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                        />
                        {errors.goalRaceDate && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Plan start date */}
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                            Plan Start Date
                        </label>
                        <input
                            type="date"
                            {...register('planStartDate', { required: true })}
                            className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                        />
                        {errors.planStartDate && <p className="text-sm text-red-500">Required</p>}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </Dialog.Panel>
        </div>
        </Dialog>
    );
}

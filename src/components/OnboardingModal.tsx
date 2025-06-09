'use client';

import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { User } from "@/lib/types";

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
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<User & {
        hours: number;
        minutes: number;
        seconds: number;
    }>({
        defaultValues: {
        experience: '',
        mileage: 0,
        trainingDays: [],
        raceDistance: '',
        raceDate: '',
        },
    });

    const onFormSubmit = (data: User & {
        hours: number;
        minutes: number;
        seconds: number;}) => {
        const payload: User = {
        experience: data.experience,
        mileage: data.mileage,
        trainingDays: data.trainingDays,
        raceDistance: data.raceDistance,
        raceGoalTime: `${data.hours}:${data.minutes}:${data.seconds}`,
        raceDate: data.raceDate,
        };

        onSubmit(payload);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md p-6 space-y-4 bg-white shadow-xl rounded-2xl dark:bg-gray-900">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                Tell us about your training
            </Dialog.Title>

            <form onSubmit={handleSubmit(onFormSubmit)} className="max-h-[90vh] pr-1 space-y-4 overflow-y-auto">
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

                {/* Weekly mileage */}
                <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Current Weekly Mileage
                </label>
                <input
                    type="number"
                    step="any"
                    min={0}
                    {...register('mileage', { required: true })}
                    className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                    placeholder="e.g. 25"
                />
                {errors.mileage && <p className="text-sm text-red-500">Required</p>}
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
                        {...register('hours', { valueAsNumber: true, min: 0, max: 24 })}
                        className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="h-5 text-sm text-red-500">
                        {errors.hours ? 'Invalid' : ''}
                    </p>
                    </div>

                    {/* Colon */}
                    <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                    <input
                        type="number"
                        placeholder="MM"
                        {...register('minutes', { valueAsNumber: true, min: 0, max: 59 })}
                        className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="h-5 text-sm text-red-500">
                        {errors.minutes ? 'Invalid' : ''}
                    </p>
                    </div>

                    <span className="pt-2 text-xl text-gray-700 dark:text-gray-300">:</span>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                    <input
                        type="number"
                        placeholder="SS"
                        {...register('seconds', { valueAsNumber: true, min: 0, max: 59 })}
                        className="w-16 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="h-5 text-sm text-red-500">
                        {errors.seconds ? 'Invalid' : ''}
                    </p>
                    </div>
                </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        Race Distance
                    </label>
                    <select
                        {...register("raceDistance", { required: true })}
                        className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Select distance</option>
                        <option value="mile">Mile</option>
                        <option value="3k">3K</option>
                        <option value="5k">5K</option>
                        <option value="10k">10K</option>
                        <option value="half_marathon">Half Marathon</option>
                        <option value="marathon">Marathon</option>
                    </select>
                    {errors.raceDistance && <p className="text-sm text-red-500">Required</p>}
                </div>


                {/* Race date */}
                <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Race Date
                </label>
                <input
                    type="date"
                    {...register('raceDate', { required: true })}
                    className="w-full p-2 text-gray-900 bg-white border rounded-md dark:bg-gray-800 dark:text-white"
                />
                {errors.raceDate && <p className="text-sm text-red-500">Required</p>}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-4">
                <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                    Save & Continue
                </button>
                </div>
            </form>
            </Dialog.Panel>
        </div>
        </Dialog>
    );
}

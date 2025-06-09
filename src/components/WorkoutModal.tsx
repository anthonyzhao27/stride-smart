'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Workout } from '@/lib/types';

export default function WorkoutModal({
    isOpen,
    onClose,
    workout,
}: {
    isOpen: boolean;
    onClose: () => void;
    workout: Workout;
}) {
    if (!workout) return null;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
                            <Dialog.Title className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Workout Details
                            </Dialog.Title>
                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <p><strong>Name:</strong> {workout.name}</p>
                                <p><strong>Date:</strong> {workout.date}</p>
                                <p><strong>Time:</strong> {workout.time}</p>
                                <p><strong>Duration:</strong> {workout.duration} minutes</p>
                                <p><strong>Distance:</strong> {workout.distance} {workout.unit}</p>
                                <p><strong>Type:</strong> {workout.type}</p>
                                <p><strong>Effort:</strong> {workout.effortLevel}</p>
                                <p><strong>Notes:</strong> {workout.notes || 'None'}</p>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                                    onClick={onClose}
                                >
                                    Close
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}

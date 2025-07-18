'use client';
import { useState } from 'react';
import { HiDotsVertical } from "react-icons/hi";
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import WorkoutModal from './WorkoutModal';
import { LoggedWorkout } from "@/lib/types";

export default function WorkoutCard({ workout, onDelete, onEdit }: { workout: LoggedWorkout, onDelete: (id: string) => Promise<void>, onEdit: (workout: LoggedWorkout) => void }) {
    const [showMore, setShowMore] = useState(false);
    
    const date = workout.timestamp.toLocaleDateString();
    const time = workout.timestamp.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const timestamp = new Date(date);
    
    const dateString = timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tsDate = new Date(timestamp);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1)

    let dateLabel = dateString;
    if (tsDate.getTime() === today.getTime()) {
        dateLabel = "Today";
    } else if (tsDate.getTime() === yesterday.getTime()) {
        dateLabel = "Yesterday";
    }

    const hours = Math.floor(workout.duration / 3600);
    const minutes = Math.floor((workout.duration % 3600) / 60);
    const seconds = workout.duration % 60;

    return (
        <>
            <div className="relative flex flex-col justify-between w-full p-5 overflow-hidden transition border border-gray-200 shadow-md h-60 rounded-2xl bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:border-gray-700 hover:shadow-lg">
                <div className="absolute z-40 top-2 right-2">
                    <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button
                            className="p-1 transition rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Options"
                        >
                            <HiDotsVertical size={18} className="text-gray-600 dark:text-gray-300" />
                        </Menu.Button>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-50 mt-1 bg-white rounded-md shadow-lg w-36 dark:bg-gray-800 ring-1 ring-black/5 focus:outline-none">
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                            active ? "bg-gray-100 dark:bg-gray-700" : ""
                                        }`}
                                        onClick={() => setShowMore(true)}
                                        >
                                        Show More
                                        </button>
                                    )}
                                </Menu.Item>

                                <Menu.Item>
                                    {({ active }) => (
                                    <button className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                    onClick={() => onEdit(workout)}
                                    >
                                        Edit
                                    </button>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                    <button className={`w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`} onClick={() => onDelete(workout.id)}>
                                        Delete
                                    </button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
                
                {/* Header + Stats */}
                <div className="mb-2">
                    {/* Header */}
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-green-700 dark:text-green-400">
                    {workout.name}
                    </h2>
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">{dateLabel} at {time}</p>

                    {/* Stats */}
                    <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <p><span className="font-semibold">Distance:</span> {workout.distance} {workout.unit}</p>
                        <p><span className="font-semibold">Duration:</span> {hours ? `${hours}h ` : ""}{minutes ? `${minutes}m ` : ""}{hours && minutes ? "" : `${seconds}s`}</p>
                        <p><span className="font-semibold">Type:</span> {workout.type}</p>
                        <p><span className="font-semibold">Effort:</span> {workout.effortLevel}</p>
                    </div>
                </div>
                
                {/* Notes + Toggle */}
                <div
                    className="text-sm italic text-gray-600 transition-all duration-300 dark:text-gray-400 line-clamp-2">
                    {workout.notes || "\u00A0"}
                </div>
            </div>
            <WorkoutModal
                isOpen={showMore}
                onClose={() => setShowMore(false)}
                workout={workout}
            />
        </>
    )
}
'use client';
import { FaBars, FaTimes} from "react-icons/fa";
import { FaMoon, FaSun } from "react-icons/fa";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LayoutWithSidebar() {
    const [isOpen, setIsOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
    
    const Profile = () => {
        const { user } = useAuth();
        return user ? (
            <Image src={user?.photoURL ?? "https://ui-avatars.com/api/?name=User&background=ddd&color=555"} alt="Profile" width={24} height={24}className="w-10 h-10 rounded-full" />
            ) : (
            <p>Not logged in</p>
        );
    };

    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const stored = localStorage.getItem("theme");
        const pefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (stored === "dark" || (!stored && pefersDark)) {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        }
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }
        else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };
    
    return (
        <>
            {/* Top nav with hamburger on mobile */}
            <nav className="sticky top-0 z-30 w-full h-16 border-b border-gray-200 shadow-sm sm:pl-0 md:pl-64 bg-white/90 dark:bg-gray-900/80 backdrop-blur-md dark:border-gray-700">
                <div className="flex items-center justify-between h-full px-4 space-x-4 sm:px-6">
                    
                    {/* Left section (hamburger + search) */}
                    <div className="flex items-center flex-grow max-w-xl space-x-3">
                        {/* Mobile hamburger */}
                        <button
                            className="text-gray-700 transition md:hidden dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400"
                            onClick={() => setIsOpen(true)}
                        >
                            <FaBars size={22} />
                        </button>

                        {/* Search bar */}
                        <div className="flex w-full mr-4">
                            <input
                                type="text"
                                placeholder="Search workouts..."
                                className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Profile />
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`
                    fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 shadow-md z-40 
                    transition-transform duration-300 ease-in-out 
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0
                    `}
                >
                    <div className="flex flex-col justify-between h-full px-6 pt-4 pb-6 text-gray-700 dark:text-gray-200">
                    {/* TOP: Logo + nav */}
                    <div>
                        {/* Header: Logo + Close button */}
                        <div className="flex items-center justify-between mb-6">
                        <span className="text-2xl font-extrabold tracking-tight text-green-600">Stride Smart</span>

                        {/* Close button (mobile only) */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-700 transition dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 md:hidden"
                            aria-label="Close sidebar"
                        >
                            <FaTimes size={24} />
                        </button>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-3 text-sm font-medium">
                            <Link
                                href="/dashboard"
                                className="block text-gray-700 transition dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/calendar"
                                className="block text-gray-700 transition dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                            >
                                Calendar
                            </Link>
                            <Link
                                href="/training-log"
                                className="block text-gray-700 transition dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                            >
                                Training Log
                            </Link>
                            <Link
                                href="/ask-ai"
                                className="block text-gray-700 transition dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                            >
                                Ask AI Coach
                            </Link>
                        </nav>
                    </div>

                    {/* BOTTOM: Theme toggle */}
                    <div className="pt-6">
                        <div className="flex items-center justify-center space-x-2">
                        <span
                            className={`text-xs font-medium transition-opacity duration-300 ${
                            isDark ? 'opacity-30 text-gray-400' : 'opacity-100 text-gray-700'
                            }`}
                        >
                            Light
                        </span>

                        <button
                            onClick={toggleTheme}
                            className={`w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                            isDark ? 'bg-blue-900' : 'bg-yellow-300'
                            }`}
                        >
                            <div
                            className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                                isDark ? 'translate-x-8 bg-blue-500' : 'translate-x-0 bg-yellow-500'
                            } flex items-center justify-center text-white`}
                            >
                            {isDark ? <FaMoon size={12} /> : <FaSun size={12} />}
                            </div>
                        </button>

                        <span
                            className={`text-xs font-medium transition-opacity duration-300 ${
                            isDark ? 'opacity-100 text-gray-300' : 'opacity-30 text-gray-500'
                            }`}
                        >
                            Dark
                        </span>
                        </div>
                    </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import Image from 'next/image';

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!auth) {
            setError('Authentication not available. Please check your configuration.');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard'); // Redirect to dashboard on successful login
        } catch {
            setError('Failed to log in. Please check your credentials.');
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth || !googleProvider) {
            setError('Authentication not available. Please check your configuration.');
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider);
            router.push('/dashboard'); // Redirect to dashboard on successful Google login
        }
        catch {
        setError('Failed to log in with Google. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
                type="submit"
                className="w-full px-4 py-2 font-bold text-white transition duration-150 ease-in-out bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-blue-300"
            >
                Login
            </button>
            <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center w-full gap-3 px-4 py-2 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                <Image
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    width={20}
                    height={20}
                    priority
                />
                <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
            </button>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                Don’t have an account?{" "}
                <a
                    href="/signup"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    Sign up
                </a>
            </p>
        </form>
    );
}
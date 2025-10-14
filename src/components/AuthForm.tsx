'use client';
import { useState } from 'react';
import { signIn } from '@/lib/cognito';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await signIn(email, password);
            router.push('/dashboard'); // Redirect to dashboard on successful login
            // Force a page reload to update auth context
            window.location.href = '/dashboard';
        } catch (err: unknown) {
            console.error('Login error:', err);
            const code = (typeof err === 'object' && err !== null && 'code' in err) ? (err as { code?: string }).code : undefined;
            if (code === 'UserNotConfirmedException') {
                setError('Please verify your email before logging in. Check your inbox for the verification code.');
            } else if (code === 'NotAuthorizedException') {
                setError('Incorrect email or password.');
            } else if (code === 'UserNotFoundException') {
                setError('No account found with this email.');
            } else if (err instanceof Error) {
                setError(err.message || 'Failed to log in. Please check your credentials.');
            } else {
                setError('Failed to log in. Please check your credentials.');
            }
        }
    };

    const handleGoogleSignIn = async () => {
        // Note: Google OAuth with Cognito requires additional setup via Hosted UI
        // For now, we'll show a message to the user
        setError('Google sign-in will be available soon. Please use email/password for now.');
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
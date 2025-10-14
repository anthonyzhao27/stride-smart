'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp } from '@/lib/cognito';

export default function SignUpForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        try {
            await signUp(email, password);
            setSuccess('Account created! Please check your email for a verification code.');
            setNeedsVerification(true);
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            const code = (typeof err === 'object' && err !== null && 'code' in err) ? (err as { code?: string }).code : undefined;
            const message = err instanceof Error ? err.message : undefined;
            if (code === 'UsernameExistsException') {
                setError('An account with this email already exists.');
            } else if (code === 'InvalidPasswordException') {
                setError('Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters.');
            } else if (message) {
                setError(message);
            } else {
                setError('Failed to sign up. Please try again.');
            }
        }
    };

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await confirmSignUp(email, verificationCode);
            setSuccess('Email verified! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: unknown) {
            console.error('Verification error:', err);
            const code = (typeof err === 'object' && err !== null && 'code' in err) ? (err as { code?: string }).code : undefined;
            if (code === 'CodeMismatchException') {
                setError('Invalid verification code. Please try again.');
            } else if (code === 'ExpiredCodeException') {
                setError('Verification code has expired. Please request a new one.');
            } else if (err instanceof Error) {
                setError(err.message || 'Failed to verify email. Please try again.');
            } else {
                setError('Failed to verify email. Please try again.');
            }
        }
    };

    if (needsVerification) {
        return (
            <form onSubmit={handleVerification} className="space-y-4">
                <div>
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Verification Code
                    </label>
                    <input
                        type="text"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        placeholder="Enter the code sent to your email"
                    />
                </div>
                {success && <p className="text-sm text-green-600">{success}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                    type="submit"
                    className="w-full px-4 py-2 font-bold text-white transition duration-150 ease-in-out bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300"
                >
                    Verify Email
                </button>
                <button
                    type="button"
                    onClick={() => setNeedsVerification(false)}
                    className="w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                    Back to Sign Up
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
            </div>
            {success && <p className="text-sm text-green-600">{success}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
                type="submit"
                className="w-full px-4 py-2 font-bold text-white transition duration-150 ease-in-out bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300"
            >
                Sign Up
            </button>
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                Have an account?{" "}
                <a
                    href="/login"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                    Log in
                </a>
            </p>
        </form>
    );
}
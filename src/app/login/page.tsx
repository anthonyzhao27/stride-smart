'use client';
import AuthForm from '../../components/AuthForm';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const {user, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [loading, user, router]);

    if (loading) {
        return <p className="mt-10 text-center">Checking user session...</p>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-gray-100">Login</h1>
                <AuthForm/>
            </div>
        </div>
    )
}
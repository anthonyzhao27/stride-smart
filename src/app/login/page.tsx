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
        return <p className="text-center mt-10">Checking user session...</p>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Login</h1>
                <AuthForm/>
            </div>
        </div>
    )
}
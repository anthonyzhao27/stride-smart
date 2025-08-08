'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AIChatInterface from '../../components/AIChatInterface';

export default function AskAIPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return <p className="mt-10 text-center">Loading...</p>
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <AIChatInterface userId={user.uid} />
        </div>
    );
}

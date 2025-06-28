'use client';
import Calendar from '@/components/Calendar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
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
        <div>
            <Calendar />
        </div>
    );
}
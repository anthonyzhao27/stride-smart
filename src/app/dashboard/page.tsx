'use client';
import Dashboard from '../../components/Dashboard';
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
        return <p className="text-center mt-10">Loading...</p>
    }

    return (
        <div>
            <Dashboard />
        </div>
    );
}
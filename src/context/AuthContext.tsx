'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, getUserAttributes, getUserSession } from '@/lib/cognito';

export type CognitoUser = {
    email: string;
    sub: string; // Cognito user ID
    attributes: { [key: string]: string | undefined };
    photoURL?: string | null;
    uid?: string; // alias for compatibility with legacy code
}

type AuthContextType = {
    user: CognitoUser | null;
    loading: boolean;
    getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true,
    getIdToken: async () => ''
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CognitoUser | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const cognitoUser = getCurrentUser();
            if (!cognitoUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Get user session to verify they're still authenticated
            await getUserSession();
            
            // Get user attributes
            const attributes = await getUserAttributes();
            
            setUser({
                email: attributes.email || '',
                sub: attributes.sub || '',
                attributes,
                photoURL: null, // Cognito doesn't provide photo by default
                uid: attributes.sub || '',
            });
        } catch (error) {
            console.error('Error loading user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const getIdToken = async (): Promise<string> => {
        try {
            const session = await getUserSession();
            return session.idToken;
        } catch (error) {
            console.error('Error getting ID token:', error);
            return '';
        }
    };

    useEffect(() => {
        loadUser();
        
        // Check session every 5 minutes
        const interval = setInterval(() => {
            loadUser();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, getIdToken }}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);

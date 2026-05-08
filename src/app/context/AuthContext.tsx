import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

interface User {
    id: string | number;
    email: string;
    name?: string;
    role?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null); // Do not trust localStorage initially
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        // Update axios default header for immediate effect
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setUser(userData);
    };

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    }, []);

    const checkAuth = useCallback(async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            // Support both { success: true, data: user } and flat { success: true, ...user }
            const resData = response.data;
            const userData = resData?.success ? (resData.data || resData.user || resData) : resData;

            if (userData && (userData.id || userData.email)) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            // api interceptor handles 401, but we handle other errors here
            if ((error as any).response?.status !== 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

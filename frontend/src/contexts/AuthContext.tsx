'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

interface User {
    id: number;
    name: string;
    factionId?: number;
    apiKey: string;
    subscription?: {
        active: boolean;
        daysLeft: number;
        expiresAt: number;
    };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = async () => {
    try {
      const response = await api.get('/api/user/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (apiKey: string) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const response = await api.post('/api/auth/login', { apiKey });

      const meRes = await api.get('/api/user/me');
      setUser(meRes.data);

      console.log('Login successful:', meRes.data?.name);
    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setUser(null);
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

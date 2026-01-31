'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse, authApi } from './api';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem('auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.login({ username, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: response.user,
          token: response.token,
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.signup({ username, password });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: response.user,
          token: response.token,
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (token) {
        await authApi.logout(token);
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  mobile_number?: string;
  dietary_preference?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, preference: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  updatePreference: (preference: string) => Promise<boolean>;
  updateProfile: (name: string, phone: string, preference: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync NextAuth session changes with local context user details
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      fetchUserProfile(session.user.email!);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session, status]);

  const fetchUserProfile = async (email: string) => {
    try {
      const uid = (session?.user as any)?.id || 'mock-id';
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          full_name: session?.user?.name || email.split('@')[0],
          email: email,
          avatar_url: (session?.user as any)?.image || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser({
          uid: data.user.id,
          displayName: data.user.fullName,
          email: data.user.email,
          mobile_number: data.user.mobileNumber,
          dietary_preference: data.user.dietaryPreference,
          avatarUrl: data.user.avatarUrl || undefined,
        });
      }
    } catch (err) {
      console.error('Error fetching user profile from database:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password: password || 'default_password',
        redirect: false,
      });

      if (result && !result.error) {
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: result?.error || 'Invalid credentials' };
    } catch (err: any) {
      console.error('NextAuth login error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'Server connection issue' };
    }
  };

  const register = async (name: string, email: string, phone: string, preference: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password: password || 'default_password',
        fullName: name,
        mobileNumber: phone,
        dietaryPreference: preference,
        isRegistering: 'true',
        redirect: false,
      });

      if (result && !result.error) {
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: result?.error || 'Could not create account' };
    } catch (err: any) {
      console.error('NextAuth registration error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'Server connection issue' };
    }
  };

  const updatePreference = async (preference: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          full_name: user.displayName,
          email: user.email,
          mobile_number: user.mobile_number,
          dietary_preference: preference,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser({
          ...user,
          dietary_preference: data.user.dietaryPreference,
          avatarUrl: data.user.avatarUrl || undefined,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update preference error:', err);
      return false;
    }
  };

  const updateProfile = async (name: string, phone: string, preference: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          full_name: name,
          email: user.email,
          mobile_number: phone,
          dietary_preference: preference,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser({
          uid: data.user.id,
          displayName: data.user.fullName,
          email: data.user.email,
          mobile_number: data.user.mobileNumber,
          dietary_preference: data.user.dietaryPreference,
          avatarUrl: data.user.avatarUrl || undefined,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update profile error:', err);
      return false;
    }
  };

  const logout = () => {
    signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updatePreference, updateProfile, logout }}>
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

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from './types';
import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import { createSignedSessionToken, verifySignedSessionToken } from './session';

interface AuthContextType {
  currentUser: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; role: Role; username: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  availableDemoUsers: User[];
}

import { DEMO_PASSWORD, getLocalUserPassword, setLocalUserPassword } from './passwords';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableDemoUsers, setAvailableDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const allUsers = await db.users.list();
        setAvailableDemoUsers(allUsers);

        // Check active signed session
        if (typeof window !== 'undefined') {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('sb_session_id='))
            ?.split('=')[1];
          const savedToken = cookieToken || localStorage.getItem('sb_session_token');

          if (savedToken) {
            const payload = verifySignedSessionToken(savedToken);
            if (payload) {
              const user = allUsers.find(u => u.id === payload.userId);
              if (user && !user.suspended) {
                setCurrentUser(user);
                document.cookie = `sb_session_id=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
                localStorage.setItem('sb_session_token', savedToken);
                setIsLoading(false);
                return;
              }
            }
          }
          // Clear invalid/expired session
          localStorage.removeItem('sb_session_token');
          localStorage.removeItem('sb_session_id');
          document.cookie = 'sb_session_id=; path=/; max-age=0; SameSite=Lax';
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    // If Supabase live credentials configured, call Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid email or password.' };
      }

      let spUser = await db.users.findById(data.user.id);
      if (!spUser && data.user.email) {
        spUser = await db.users.findByEmail(data.user.email);
      }
      if (!spUser) {
        return { success: false, error: 'User profile not found in database for authenticated account.' };
      }
      if (spUser.suspended) {
        return { success: false, error: 'Account is suspended. Please contact support.' };
      }

      const signedToken = createSignedSessionToken(spUser.id);
      setCurrentUser(spUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb_session_token', signedToken);
        document.cookie = `sb_session_id=${signedToken}; path=/; max-age=86400; SameSite=Lax`;
      }
      return { success: true };
    }

    // Verify against application user database
    const user = await db.users.findByEmail(email.trim());
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.suspended) {
      return { success: false, error: 'Account is suspended. Please contact support.' };
    }

    // Validate password for local mode
    const storedPass = getLocalUserPassword(user.email);
    if (password !== storedPass) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Create authenticated session
    const signedToken = createSignedSessionToken(user.id);
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_session_token', signedToken);
      document.cookie = `sb_session_id=${signedToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    return { success: true };
  };

  const signup = async (data: { name: string; email: string; password: string; role: Role; username: string }) => {
    if (!data.email || !data.password || !data.name) {
      return { success: false, error: 'All fields are required.' };
    }

    if (data.role === 'ADMIN') {
      return { success: false, error: 'Admin account creation is restricted.' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const existing = await db.users.findByEmail(data.email.trim());
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    // If Supabase live credentials configured, call Supabase Auth Signup
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: { name: data.name, role: data.role, username: data.username }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    // Store in local DB & local password registry
    const newUser = await db.users.create({
      name: data.name,
      email: data.email.trim(),
      username: data.username || data.email.split('@')[0],
      role: data.role
    });

    setLocalUserPassword(newUser.email, data.password);

    // Create authenticated session
    const signedToken = createSignedSessionToken(newUser.id);
    setCurrentUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_session_token', signedToken);
      document.cookie = `sb_session_id=${signedToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    const updatedUsers = await db.users.list();
    setAvailableDemoUsers(updatedUsers);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb_session_token');
      localStorage.removeItem('sb_session_id');
      document.cookie = 'sb_session_id=; path=/; max-age=0; SameSite=Lax';
    }
  };

  // Derive role strictly from authenticated user object
  const role: Role = currentUser?.role || 'FREELANCER';
  const isAuthenticated: boolean = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        availableDemoUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

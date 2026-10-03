import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  loginAs: (userId: string) => void;
  loginWithEmail: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  activeSessionExpiry: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('todo_agent_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem('todo_agent_current_user_id');
    const found = allUsers.find(u => u.id === savedId);
    return found || allUsers[0]; // Default to Alex Mercer (Admin)
  });

  const [activeSessionExpiry] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    localStorage.setItem('todo_agent_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('todo_agent_current_user_id', currentUser.id);
  }, [currentUser]);

  const loginAs = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const loginWithEmail = (email: string, role: UserRole = 'engineer'): boolean => {
    let existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      const newUser: User = {
        id: `user_${Date.now().toString(36)}`,
        name: email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
        email,
        role,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        department: role === 'admin' ? 'Executive Architecture' : 'Engineering Operations',
        permissions: role === 'admin' ? ['all'] : ['tasks:create', 'tasks:update'],
        mfaVerified: true,
      };
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      return true;
    } else {
      setCurrentUser(existing);
      return true;
    }
  };

  const logout = () => {
    // Switch to first guest/standard user or re-authenticate
    setCurrentUser(allUsers[3] || allUsers[0]);
  };

  const updateUser = (updated: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updated }));
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updated } : u));
  };

  const hasPermission = (permission: string): boolean => {
    if (currentUser.permissions.includes('all')) return true;
    if (currentUser.permissions.includes(permission)) return true;
    if (currentUser.role === 'admin') return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        loginAs,
        loginWithEmail,
        logout,
        updateUser,
        hasPermission,
        activeSessionExpiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

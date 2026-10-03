import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginDemoUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local fallback user first
    const stored = localStorage.getItem('plantcare_auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Plant Parent',
            photoURL: firebaseUser.photoURL,
            createdAt: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem('plantcare_auth_user', JSON.stringify(profile));
        } else if (!stored) {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem('plantcare_auth_user', JSON.stringify(profile));
    } else {
      // Local fallback auth
      const profile: UserProfile = {
        uid: 'user-' + btoa(email).replace(/=/g, '').substring(0, 10),
        email,
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem('plantcare_auth_user', JSON.stringify(profile));
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem('plantcare_auth_user', JSON.stringify(profile));
    } else {
      const profile: UserProfile = {
        uid: 'user-' + Date.now(),
        email,
        displayName: name,
        createdAt: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem('plantcare_auth_user', JSON.stringify(profile));
    }
  };

  const loginDemoUser = async () => {
    const demoProfile: UserProfile = {
      uid: 'demo-capstone-user',
      email: 'demo@plantcare.ai',
      displayName: 'Alex Rivers (Demo)',
      createdAt: '2026-01-15T00:00:00Z',
      isDemoUser: true,
    };
    setUser(demoProfile);
    localStorage.setItem('plantcare_auth_user', JSON.stringify(demoProfile));
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem('plantcare_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginDemoUser, logout }}>
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

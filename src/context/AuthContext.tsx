
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

interface AuthContextType {
  currentUser: (User & { uid: string }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<(User & { uid: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleBeforeUnload = async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
                online: false,
                lastSeen: serverTimestamp()
            });
        }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        updateDoc(userDocRef, { online: true });

        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            setCurrentUser({ uid: user.uid, ...userDoc.data() } as User & { uid: string });
          } else {
            setCurrentUser({ uid: user.uid, email: user.email!, name: '', avatar: '' });
          }
          setLoading(false);
        });
        
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            unsubscribeSnapshot();
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleBeforeUnload(); // Call it on component unmount too
        };
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    const userDoc = {
        uid: user.uid,
        email: user.email,
        name: user.email?.split('@')[0] || `User-${user.uid.substring(0,5)}`,
        avatar: `https://placehold.co/100x100.png`,
        online: true,
        lastSeen: serverTimestamp(),
        privacySettings: {
            showLastSeen: true,
            showOnlineStatus: true,
        }
    };
    await setDoc(doc(db, "users", user.uid), userDoc);
    return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
            online: false,
            lastSeen: serverTimestamp()
        });
    }
    return signOut(auth);
  };

  const updateCurrentUser = (data: Partial<User>) => {
    if (currentUser) {
      setCurrentUser(prevUser => {
        if (prevUser) {
          return { ...prevUser, ...data };
        }
        return null;
      });
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateCurrentUser
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

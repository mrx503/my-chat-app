
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, AuthErrorCodes } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { format } from 'date-fns';

const SYSTEM_BOT_UID = 'system-bot-uid';

const ensureSystemBotExists = async () => {
    const botDocRef = doc(db, 'users', SYSTEM_BOT_UID);
    const botDoc = await getDoc(botDocRef);
    if (!botDoc.exists()) {
        await setDoc(botDocRef, {
            uid: SYSTEM_BOT_UID,
            name: 'System',
            email: 'system@duck.app',
            avatar: `https://placehold.co/100x100.png`,
            online: true,
            lastSeen: serverTimestamp(),
            isBot: true,
        });
    }
};

interface AuthContextType {
  currentUser: (User & { uid: string }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  updateCurrentUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<(User & { uid: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureSystemBotExists();

    const handleBeforeUnload = async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            // Check if document exists before updating
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                 await updateDoc(userDocRef, {
                    online: false,
                    lastSeen: serverTimestamp()
                });
            }
        }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Use setDoc with merge to safely create or update the user's online status
        setDoc(userDocRef, { online: true }, { merge: true });

        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // --- Fallback for legacy accounts & data normalization ---
            if (userData.followers === undefined) userData.followers = [];
            if (userData.following === undefined) userData.following = [];
            if (userData.coins === undefined || userData.coins === null || isNaN(userData.coins)) userData.coins = 0; // SOURCE OF FIX
            if (userData.systemMessagesQueue === undefined) userData.systemMessagesQueue = [];
            if (userData.isBanned === undefined) userData.isBanned = false;
            if (userData.isVerified === undefined) userData.isVerified = false;
            
            // Convert Firestore Timestamp to Date object for client-side use
            if (userData.bannedUntil && typeof (userData.bannedUntil as any).toDate === 'function') {
              userData.bannedUntil = (userData.bannedUntil as any).toDate();
            } else {
              userData.bannedUntil = null;
            }


            setCurrentUser({ uid: user.uid, ...userData } as User & { uid: string });
          } else {
            // This case handles a user who is authenticated but doesn't have a doc yet.
            // The signup function should handle doc creation, but this is a fallback.
             const newUser: User & { uid: string } = {
                uid: user.uid,
                email: user.email!,
                name: user.email?.split('@')[0] || '',
                avatar: '',
                coins: 0,
                followers: [],
                following: [],
                systemMessagesQueue: [],
                isBanned: false,
                bannedUntil: null,
                isVerified: false,
                id: user.uid
             };
            setCurrentUser(newUser);
          }
          setLoading(false);
        });
        
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            unsubscribeSnapshot();
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleBeforeUnload();
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

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    const userDocData = {
        uid: user.uid,
        email: user.email,
        name: name || `User-${user.uid.substring(0,5)}`,
        avatar: `https://placehold.co/100x100.png`,
        online: true,
        lastSeen: serverTimestamp(),
        privacySettings: {
            showLastSeen: true,
            showOnlineStatus: true,
        },
        coins: 0,
        followers: [],
        following: [],
        systemMessagesQueue: [],
        pushSubscription: null,
        isBanned: false,
        bannedUntil: null,
        isVerified: false,
    };
    await setDoc(doc(db, "users", user.uid), userDocData);
    return userCredential;
  };

  const login = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data() as any; // Use any to access toDate
            if (userData.isBanned) {
                await signOut(auth);
                throw new Error("Your account has been permanently banned.");
            }
            if (userData.bannedUntil && userData.bannedUntil.toDate() > new Date()) {
                 await signOut(auth);
                 throw new Error(`Your account is restricted until ${format(userData.bannedUntil.toDate(), 'PPP p')}.`);
            }
        }
        return userCredential;
    } catch(error: any) {
        if(error.code && error.message) {
             throw new Error(error.message);
        }
        throw error;
    }
  };

  const logout = async () => {
    if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if(userDoc.exists()){
            await updateDoc(userDocRef, {
                online: false,
                lastSeen: serverTimestamp(),
                pushSubscription: null
            });
        }
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

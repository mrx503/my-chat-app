
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import OneSignal from 'react-onesignal';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

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

const setupOneSignal = async (userId: string) => {
    if (typeof window === 'undefined' || !ONE_SIGNAL_APP_ID || OneSignal.initialized) return;

    try {
        // Use the default OneSignal initialization. It will look for the service worker files
        // in the root public directory. This is the most stable configuration.
        await OneSignal.init({
             appId: ONE_SIGNAL_APP_ID,
        });

        OneSignal.login(userId);

        OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
             console.log('OneSignal permission changed:', permission);
        });

        // Use an event listener to get the player ID when it becomes available
        OneSignal.User.PushSubscription.addEventListener('change', async (change) => {
            if (change.current.id) {
                console.log("OneSignal Player ID found:", change.current.id);
                const userDocRef = doc(db, 'users', userId);
                await updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
            }
        });

    } catch (error) {
        console.error("Error initializing OneSignal:", error);
    }
}


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
    ensureSystemBotExists();

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
        setupOneSignal(user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        
        updateDoc(userDocRef, { online: true });

        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.systemMessagesQueue) {
              userData.systemMessagesQueue = [];
            }
            setCurrentUser({ uid: user.uid, ...userData } as User & { uid: string });
          } else {
            setCurrentUser({ 
              uid: user.uid, 
              email: user.email!, 
              name: '', 
              avatar: '', 
              coins: 0,
              systemMessagesQueue: []
            });
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
        },
        coins: 0,
        systemMessagesQueue: [],
        pushSubscription: null,
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
    OneSignal.logout();
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

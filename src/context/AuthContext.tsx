
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User, PushSubscription } from '@/lib/types';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { VAPID_PUBLIC_KEY } from '@/lib/env';

const SYSTEM_BOT_UID = 'system-bot-uid';

const ensureSystemBotExists = async () => {
    const botDocRef = doc(db, 'users', SYSTEM_BOT_UID);
    const botDoc = await getDoc(botDocRef);
    if (!botDoc.exists()) {
        await setDoc(botDocRef, {
            uid: SYSTEM_BOT_UID,
            name: 'System',
            email: 'system@duck.app',
            avatar: 'https://placehold.co/100x100.png',
            online: true,
            lastSeen: serverTimestamp(),
            isBot: true,
        });
    }
};

const setupPushNotifications = async (userId: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported by this browser.');
        return;
    }
    
    const vapidPublicKey = VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
        console.error('VAPID public key not found. Cannot subscribe to push notifications.');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const permission = await window.Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Push notification permission not granted.');
            return;
        }

        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('User is already subscribed.');
            // Optional: You might want to update the subscription on your server anyway
            await saveSubscription(userId, existingSubscription);
            return;
        }

        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await saveSubscription(userId, newSubscription);

    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
    }
};

const saveSubscription = async (userId: string, subscription: globalThis.PushSubscription) => {
    const userDocRef = doc(db, 'users', userId);
    const subscriptionJSON = subscription.toJSON();
    const dbSubscription: PushSubscription = {
        endpoint: subscriptionJSON.endpoint!,
        expirationTime: subscriptionJSON.expirationTime,
        keys: {
            p256dh: subscriptionJSON.keys!.p256dh!,
            auth: subscriptionJSON.keys!.auth!,
        },
    };
    await updateDoc(userDocRef, { pushSubscription: dbSubscription });
};


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
        setupPushNotifications(user.uid);
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

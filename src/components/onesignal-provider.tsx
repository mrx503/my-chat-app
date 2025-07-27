
"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

// This flag ensures that OneSignal is initialized only once in the entire application lifecycle.
let isOneSignalInitialized = false;

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();

    useEffect(() => {
        const setupOneSignal = async (user: any) => {
            if (isOneSignalInitialized || !ONE_SIGNAL_APP_ID) {
                return;
            }
            isOneSignalInitialized = true;
            
            try {
                await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
                OneSignal.login(user.uid);

                OneSignal.User.PushSubscription.addEventListener('change', async (change) => {
                    if (change.current.id && change.current.id !== user.oneSignalPlayerId) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', user.uid);
                        await updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                });
            } catch (error) {
                console.error("Error initializing OneSignal:", error);
                isOneSignalInitialized = false; // Reset on failure to allow retry
            }
        };

        if (currentUser) {
            setupOneSignal(currentUser);
        } else {
            if (isOneSignalInitialized) {
                OneSignal.logout();
                isOneSignalInitialized = false;
            }
        }
    }, [currentUser]);
    
    useEffect(() => {
        // This effect ensures that logout is clean even if the component unmounts
        return () => {
            if (isOneSignalInitialized && !auth.currentUser) {
                OneSignal.logout();
                isOneSignalInitialized = false;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{children}</>;
}

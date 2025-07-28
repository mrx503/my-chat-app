
"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current || !ONE_SIGNAL_APP_ID) {
            return;
        }

        const initializeOneSignal = async () => {
            try {
                // Initialize OneSignal only once
                await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
                isInitialized.current = true;
                console.log("OneSignal Initialized successfully.");

                // Now that it's initialized, handle the current user state
                if (auth.currentUser) {
                    OneSignal.login(auth.currentUser.uid);
                    console.log(`OneSignal login called for user: ${auth.currentUser.uid}`);
                }

            } catch (error) {
                console.error("Error initializing OneSignal:", error);
            }
        };

        initializeOneSignal();

    }, []); // This effect runs only once on mount

    useEffect(() => {
        // This effect handles user changes AFTER OneSignal has been initialized.
        if (!isInitialized.current || !currentUser) {
            // If a user logs out, logout from OneSignal
            if (OneSignal.User.isLoggedIn()) {
                 OneSignal.logout();
                 console.log("OneSignal logout called.");
            }
            return;
        }

        // User is logged in, and OneSignal is initialized.
        if (!OneSignal.User.isLoggedIn()) {
             OneSignal.login(currentUser.uid);
             console.log(`OneSignal login called on user change for: ${currentUser.uid}`);
        }

        const onPlayerIdChange = (change: any) => {
            if (change.current.id && change.current.id !== currentUser.oneSignalPlayerId) {
                console.log("OneSignal Player ID updated:", change.current.id);
                const userDocRef = doc(db, 'users', currentUser.uid);
                updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
            }
        };

        OneSignal.User.PushSubscription.addEventListener('change', onPlayerIdChange);

        return () => {
            OneSignal.User.PushSubscription.removeEventListener('change', onPlayerIdChange);
        };
    }, [currentUser]); // This effect reacts to user login/logout

    return <>{children}</>;
}

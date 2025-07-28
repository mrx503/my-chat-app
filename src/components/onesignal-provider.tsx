
"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

// This ref will persist across re-renders and will not be reset.
// It tracks if OneSignal.init() has ever been called in the app's lifetime.
const isOneSignalInitialized = { current: false };

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const hasRun = useRef(false); // Used to track if the main effect has run

    useEffect(() => {
        // This effect should only run once per user session
        if (!currentUser || hasRun.current) {
            if (!currentUser && hasRun.current) {
                // User logged out, so reset for the next login
                console.log("User logged out, resetting OneSignal state.");
                OneSignal.logout();
                hasRun.current = false;
            }
            return;
        }

        const initializeAndLogin = async () => {
            if (!isOneSignalInitialized.current) {
                if (!ONE_SIGNAL_APP_ID) {
                    console.error("OneSignal App ID is not configured.");
                    return;
                }
                // The init function should only be called once in the entire app lifecycle
                await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
                isOneSignalInitialized.current = true;
                console.log("OneSignal has been initialized.");
            }

            // Now, handle user login and subscription
            if (currentUser) {
                hasRun.current = true; // Mark as run for this user session
                console.log(`Logging in OneSignal for user: ${currentUser.uid}`);
                await OneSignal.login(currentUser.uid);
                console.log(`OneSignal login successful.`);

                OneSignal.User.PushSubscription.addEventListener('change', (change) => {
                    if (change.current.id && currentUser) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                });
            }
        };

        initializeAndLogin();

    }, [currentUser]); // This effect now correctly depends on the user state

    return <>{children}</>;
}


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
    const hasRun = useRef(false); // Used to track if the main effect has run for the current user

    useEffect(() => {
        // If there is no user, logout and do nothing further.
        if (!currentUser) {
            if (hasRun.current) {
                console.log("User logged out, resetting OneSignal state.");
                OneSignal.logout();
                hasRun.current = false;
            }
            return;
        }

        // If the effect has already run for this user, don't run it again.
        if (hasRun.current) {
            return;
        }

        const initializeAndLogin = async () => {
            try {
                // Explicitly log out to clear any previous user state.
                await OneSignal.logout();
                console.log("OneSignal logged out previous user.");

                // Initialize OneSignal if it hasn't been already.
                if (!isOneSignalInitialized.current) {
                    if (!ONE_SIGNAL_APP_ID) {
                        console.error("OneSignal App ID is not configured.");
                        return;
                    }
                    await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
                    isOneSignalInitialized.current = true;
                    console.log("OneSignal has been initialized.");
                }

                // Now, log in the current user.
                console.log(`Logging in OneSignal for user: ${currentUser.uid}`);
                await OneSignal.login(currentUser.uid);
                console.log(`OneSignal login successful for ${currentUser.uid}`);
                hasRun.current = true; // Mark as run for this user session.

                // Add listener for Player ID changes
                OneSignal.User.PushSubscription.addEventListener('change', (change) => {
                    if (change.current.id && currentUser) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                });

            } catch (error) {
                console.error("Error during OneSignal setup:", error);
            }
        };

        initializeAndLogin();

    }, [currentUser]);

    return <>{children}</>;
}

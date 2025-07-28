
"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

// This ref tracks if OneSignal.init() has ever been called in the app's lifetime.
// It's outside the component to act like a static variable.
const isOneSignalInitialized = { current: false };

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    // This ref tracks if we have already run the login/logout logic for the current user instance
    // to avoid redundant calls within the same session.
    const hasRunForCurrentUser = useRef(false);

    // Effect 1: Initialize OneSignal ONCE.
    useEffect(() => {
        if (isOneSignalInitialized.current) {
            return;
        }

        const initialize = async () => {
            if (!ONE_SIGNAL_APP_ID) {
                console.error("OneSignal App ID is not configured.");
                return;
            }
            isOneSignalInitialized.current = true;
            await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
            console.log("OneSignal has been initialized.");
        };
        
        initialize();
    }, []);

    // Effect 2: Handle user login/logout and Player ID updates.
    useEffect(() => {
        // Wait until OneSignal is initialized before doing anything.
        if (!isOneSignalInitialized.current) {
            return;
        }

        const handleUserSession = async () => {
            if (currentUser) {
                if (hasRunForCurrentUser.current) return;
                
                console.log(`Logging in OneSignal for user: ${currentUser.uid}`);
                await OneSignal.login(currentUser.uid);
                console.log(`OneSignal login successful for ${currentUser.uid}`);
                hasRunForCurrentUser.current = true;

                // Set up listener for Player ID changes
                OneSignal.User.PushSubscription.addEventListener('change', (change) => {
                    if (change.current.id && currentUser) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                });

            } else {
                // User is logged out
                if (!hasRunForCurrentUser.current) return;
                console.log("User logged out, logging out from OneSignal.");
                await OneSignal.logout();
                hasRunForCurrentUser.current = false;
            }
        };
        
        handleUserSession();

    }, [currentUser]);

    return <>{children}</>;
}


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
    const ranLogin = useRef(false);
    const ranLogout = useRef(false);

    useEffect(() => {
        if (!isOneSignalInitialized.current && ONE_SIGNAL_APP_ID) {
            isOneSignalInitialized.current = true; // Set this flag immediately
            OneSignal.init({ appId: ONE_SIGNAL_APP_ID }).then(() => {
                console.log("OneSignal Initialized successfully.");
                // This will run after init completes and handle the user state
                // by triggering the second useEffect.
            }).catch(error => {
                isOneSignalInitialized.current = false; // Reset on failure
                console.error("Error initializing OneSignal:", error);
            });
        }
    }, []); // Empty dependency array ensures this runs only once per component mount.

    useEffect(() => {
        // This effect waits for OneSignal to be ready and handles user changes.
        OneSignal.ready(() => {
            if (currentUser && !ranLogin.current) {
                console.log(`OneSignal login for user: ${currentUser.uid}`);
                OneSignal.login(currentUser.uid);
                ranLogin.current = true;
                ranLogout.current = false;

                const onPlayerIdChange = (change: any) => {
                    if (change.current.id && currentUser) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                };
        
                OneSignal.User.PushSubscription.addEventListener('change', onPlayerIdChange);

                // Cleanup listener on component unmount or user change
                return () => {
                    OneSignal.User.PushSubscription.removeEventListener('change', onPlayerIdChange);
                };

            } else if (!currentUser && !ranLogout.current) {
                console.log("OneSignal logout called.");
                OneSignal.logout();
                ranLogout.current = true;
                ranLogin.current = false;
            }
        });
    }, [currentUser]); // This effect reacts to user login/logout.

    return <>{children}</>;
}

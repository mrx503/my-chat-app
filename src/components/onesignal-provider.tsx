
"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const initialized = useRef(false);

    // Effect for initializing OneSignal once
    useEffect(() => {
        if (initialized.current || !ONE_SIGNAL_APP_ID) {
            return;
        }
        initialized.current = true;
        
        const init = async () => {
            try {
                await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
            } catch (error) {
                console.error("Error initializing OneSignal:", error);
                initialized.current = false; // Allow retry on failure
            }
        };
        init();
    }, []);

    // Effect for handling user login/logout with OneSignal
    useEffect(() => {
        if (!initialized.current) {
            return;
        }

        const handleUserChange = async () => {
            if (currentUser) {
                // User is logged in, associate with OneSignal
                OneSignal.login(currentUser.uid);

                // Add listener for Player ID changes
                OneSignal.User.PushSubscription.addEventListener('change', async (change) => {
                    if (change.current.id && change.current.id !== currentUser.oneSignalPlayerId) {
                        console.log("OneSignal Player ID updated:", change.current.id);
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        await updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                    }
                });

            } else {
                // User is logged out
                if (OneSignal.User.PushSubscription.id) {
                     OneSignal.logout();
                }
            }
        };

        handleUserChange();

        // Cleanup function for the listener
        return () => {
            OneSignal.User.PushSubscription.removeEventListener('change');
        };

    }, [currentUser]);

    return <>{children}</>;
}


"use client";

import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONE_SIGNAL_APP_ID } from '@/lib/env';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser, logout } = useAuth();
    const initialized = useRef(false);

    useEffect(() => {
        const setupOneSignal = async (user: any) => {
            if (initialized.current || !ONE_SIGNAL_APP_ID) {
                return;
            }
            initialized.current = true;
            
            await OneSignal.init({ appId: ONE_SIGNAL_APP_ID });
            OneSignal.login(user.uid);
            
            OneSignal.User.PushSubscription.addEventListener('change', async (change) => {
                if (change.current.id && change.current.id !== user.oneSignalPlayerId) {
                    console.log("OneSignal Player ID updated:", change.current.id);
                    const userDocRef = doc(db, 'users', user.uid);
                    await updateDoc(userDocRef, { oneSignalPlayerId: change.current.id });
                }
            });
        };

        if (currentUser) {
            setupOneSignal(currentUser);
        } else {
            if (initialized.current) {
                OneSignal.logout();
                initialized.current = false;
            }
        }
    }, [currentUser]);
    
    useEffect(() => {
        const handleLogout = () => {
             if (initialized.current) {
                OneSignal.logout();
                initialized.current = false;
            }
        }

        // A bit of a hack to tie into the logout function from useAuth
        (logout as any).__proto__.apply = new Proxy(
            (logout as any).__proto__.apply, {
                apply: (target, thisArg, args) => {
                    handleLogout();
                    return Reflect.apply(target, thisArg, args);
                }
            }
        )
    }, [logout]);


    return <>{children}</>;
}

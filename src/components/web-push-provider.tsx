
"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VAPID_PUBLIC_KEY } from '@/lib/env';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function WebPushProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const isSubscribing = useRef(false);

    useEffect(() => {
        if (!currentUser || isSubscribing.current) {
            return;
        }

        const subscribeToPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.warn('Push messaging is not supported');
                return;
            }

            isSubscribing.current = true;

            try {
                const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered:', swRegistration);
                
                let subscription = await swRegistration.pushManager.getSubscription();

                if (subscription === null) {
                    console.log('No subscription found, creating new one.');
                    
                    if (Notification.permission === 'denied') {
                        toast({
                            variant: 'destructive',
                            title: 'Notifications Blocked',
                            description: 'Please enable notifications in your browser settings to receive updates.',
                        });
                         isSubscribing.current = false;
                        return;
                    }

                    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                    subscription = await swRegistration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey,
                    });
                }
                
                if (subscription) {
                    console.log('User is subscribed:', subscription);
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    await updateDoc(userDocRef, {
                        pushSubscription: JSON.parse(JSON.stringify(subscription)),
                    });
                }
            } catch (error) {
                console.error('Failed to subscribe the user: ', error);
                if (Notification.permission === 'denied') {
                     toast({
                        variant: 'destructive',
                        title: 'Notifications Blocked',
                        description: 'You have blocked notifications. Please enable them in your browser settings.',
                    });
                }
            } finally {
                isSubscribing.current = false;
            }
        };

        subscribeToPush();

    }, [currentUser, toast]);

    return <>{children}</>;
}

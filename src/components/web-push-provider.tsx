
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VAPID_PUBLIC_KEY } from '@/lib/env';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export const subscribeToPush = async (userId: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
    }

    try {
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered successfully:', swRegistration);
        
        let subscription = await swRegistration.pushManager.getSubscription();
        
        if (!subscription) {
            console.log('No subscription found, creating new one.');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.error('Permission for Notifications was denied.');
                return false;
            }

            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
        }
        
        console.log('User is subscribed:', subscription);
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            pushSubscription: JSON.parse(JSON.stringify(subscription)),
        });
        return true;

    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        return false;
    }
};


export default function WebPushProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const hasSubscribed = useRef(false);

    const handleSubscription = useCallback(async () => {
        if (!currentUser || hasSubscribed.current || Notification.permission !== 'granted') {
            return;
        }

        hasSubscribed.current = true; // Attempt subscription only once per session

        const success = await subscribeToPush(currentUser.uid);
        if (success) {
            toast({
                title: 'Notifications Enabled',
                description: 'You will now receive notifications for new messages.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Subscription Failed',
                description: 'Could not set up notifications. Please try again later.',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, toast]);

    useEffect(() => {
        // Automatically attempt to subscribe if permission is already granted
        handleSubscription();
    }, [handleSubscription]);

    return <>{children}</>;
}

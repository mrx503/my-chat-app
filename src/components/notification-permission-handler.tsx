
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToPush } from '@/components/web-push-provider';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

export default function NotificationPermissionHandler() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        } else {
            setIsSupported(false);
        }
    }, []);

    const handleEnableNotifications = async () => {
        if (!currentUser) {
            toast({
                variant: 'destructive',
                title: 'Login Required',
                description: 'Please log in to enable notifications.',
            });
            return;
        }

        try {
            const success = await subscribeToPush(currentUser.uid);
            if (success) {
                toast({
                    title: 'Success!',
                    description: 'Notifications have been enabled.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Notifications Blocked',
                    description: 'Please allow notifications in your browser settings and try again.',
                });
            }
             // Update permission state after attempt
            setPermission(Notification.permission);
        } catch (error) {
            console.error("Error during subscription process:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred while enabling notifications.',
            });
        }
    };

    if (!isSupported || permission === 'granted') {
        return null;
    }

    return (
        <Alert variant={permission === 'denied' ? 'destructive' : 'default'} className="mb-4">
            {permission === 'denied' ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            <AlertTitle>
                {permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>
                    {permission === 'denied' 
                        ? 'You have blocked notifications. To enable them, please update your browser settings.'
                        : 'Get notified when you receive new messages.'
                    }
                </span>
                 {permission !== 'denied' && (
                    <Button onClick={handleEnableNotifications} size="sm">
                        <Bell className="mr-2 h-4 w-4" /> Enable
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}


"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Bot, Bell } from 'lucide-react';
import Logo from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import NotificationsPopover from './notifications-popover';
import type { AppNotification } from '@/lib/types';

interface AppHeaderProps {
    logout: () => Promise<void>;
    systemUnreadCount: number;
    onSystemChatSelect: () => void;
    notifications: AppNotification[];
    unreadNotificationsCount: number;
    onMarkNotificationsRead: () => void;
}

export default function AppHeader({ 
    logout,
    systemUnreadCount,
    onSystemChatSelect,
    notifications,
    unreadNotificationsCount,
    onMarkNotificationsRead
 }: AppHeaderProps) {

    return (
        <header className="flex items-center justify-between p-4 bg-background border-b shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <h1 className="text-xl font-bold text-primary">duck</h1>
            </div>
            <div className="flex items-center gap-2">
                <NotificationsPopover 
                    notifications={notifications} 
                    unreadCount={unreadNotificationsCount} 
                    onMarkRead={onMarkNotificationsRead}
                />

                <Button variant="ghost" size="icon" className="relative" onClick={onSystemChatSelect}>
                    <Bot className="h-5 w-5" />
                    {systemUnreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{systemUnreadCount}</Badge>
                    )}
                     <span className="sr-only">System Messages</span>
                </Button>

                <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    Logout
                </Button>
            </div>
        </header>
    );
}


"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Bot, Bell } from 'lucide-react';
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
                <h1 className="text-2xl font-bold text-primary">duck</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <NotificationsPopover 
                    notifications={notifications} 
                    unreadCount={unreadNotificationsCount} 
                    onMarkRead={onMarkNotificationsRead}
                />

                <Button variant="ghost" size="icon" className="relative" onClick={onSystemChatSelect}>
                    <Bot className="h-6 w-6" />
                    {systemUnreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{systemUnreadCount}</Badge>
                    )}
                     <span className="sr-only">System Messages</span>
                </Button>

                <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-0 h-5 w-5 md:mr-2"/>
                    <span className="hidden md:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
}

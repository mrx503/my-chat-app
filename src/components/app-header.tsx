
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Bell, Menu, LogIn } from 'lucide-react';
import NotificationsPopover from './notifications-popover';
import type { AppNotification } from '@/lib/types';
import Logo from './logo';
import { Badge } from './ui/badge';

interface AppHeaderProps {
    systemUnreadCount: number;
    onSystemChatSelect: () => void;
    notifications: AppNotification[];
    unreadNotificationsCount: number;
    onMarkNotificationsRead: () => void;
    onToggleSidebar: () => void;
}

export default function AppHeader({ 
    systemUnreadCount,
    onSystemChatSelect,
    notifications,
    unreadNotificationsCount,
    onMarkNotificationsRead,
    onToggleSidebar
 }: AppHeaderProps) {

    return (
        <header className="flex items-center justify-between p-4 bg-background border-b shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
                <div className="flex items-center gap-2">
                    <Logo />
                    <h1 className="text-2xl font-bold text-primary">duck</h1>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <NotificationsPopover 
                    notifications={notifications} 
                    unreadCount={unreadNotificationsCount} 
                    onMarkRead={onMarkNotificationsRead}
                />

                <Button variant="ghost" size="icon" className="relative h-11 w-11" onClick={onSystemChatSelect}>
                    <Bot className="h-7 w-7" />
                    {systemUnreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">{systemUnreadCount}</Badge>
                    )}
                     <span className="sr-only">System Messages</span>
                </Button>
            </div>
        </header>
    );
}

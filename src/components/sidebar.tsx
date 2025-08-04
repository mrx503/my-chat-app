
"use client";

import React from 'react';
import ProfileCard from './profile-card';
import type { User } from '@/lib/types';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface SidebarProps {
    currentUser: User & { uid: string };
    updateCurrentUser: (data: Partial<User>) => void;
    logout: () => Promise<void>;
}

export default function Sidebar({ currentUser, updateCurrentUser, logout }: SidebarProps) {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <aside className="w-72 flex-shrink-0 border-r bg-background flex flex-col h-screen">
            <ScrollArea className="flex-1">
                <div className="p-2">
                    <ProfileCard currentUser={currentUser} />
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                 <Button variant="outline" className="w-full" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    <span>Logout</span>
                </Button>
            </div>
        </aside>
    );
}

"use client";

import React from 'react';
import ProfileCard from './profile-card';
import type { User } from '@/lib/types';
import { Button } from './ui/button';
import { LogOut, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

interface SidebarProps {
    currentUser: User & { uid: string };
    updateCurrentUser: (data: Partial<User>) => void;
    logout: () => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ currentUser, updateCurrentUser, logout, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    />

                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className={cn(
                            "fixed top-0 left-0 h-full w-72 flex-shrink-0 border-r bg-background flex flex-col z-40"
                        )}
                    >
                        <div className="flex items-center justify-between p-2 border-b">
                            <h2 className="text-lg font-semibold pl-2">Menu</h2>
                             <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close sidebar</span>
                            </Button>
                        </div>
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
                             <div className="text-center mt-4 space-y-2">
                                <div className="space-x-4">
                                    <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:underline">
                                        Privacy Policy
                                    </Link>
                                    <Link href="/terms-of-use" className="text-xs text-muted-foreground hover:underline">
                                        Terms of Use
                                    </Link>
                                </div>
                                <div>
                                     <Link href="/contact-us" className="text-xs text-muted-foreground hover:underline">
                                        Contact Us
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

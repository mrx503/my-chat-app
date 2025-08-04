
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/app-header';
import Sidebar from '@/components/sidebar';
import { cn } from '@/lib/utils';
import CreatePost from '@/components/create-post';

export default function Home() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [currentUser, router]);

  if (loading || !currentUser) {
    return (
        <div className="flex justify-center items-center h-screen bg-background">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading your session...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-screen bg-muted/40 overflow-hidden">
        <Sidebar 
            currentUser={currentUser}
            updateCurrentUser={updateCurrentUser}
            logout={logout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
        />
        <div className={cn("flex flex-col flex-1 transition-all duration-300", isSidebarOpen ? "md:ml-72" : "ml-0")}>
            <AppHeader 
                systemUnreadCount={0} // Placeholder, will be wired up later
                onSystemChatSelect={() => router.push('/chats')} // Placeholder
                notifications={[]} // Placeholder
                unreadNotificationsCount={0} // Placeholder
                onMarkNotificationsRead={() => {}} // Placeholder
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto grid grid-cols-1 gap-8">
                   <CreatePost user={currentUser} />
                   {/* Post feed will be rendered here */}
                   <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Post feed coming soon!</p>
                   </div>
                </div>
            </main>
        </div>
    </div>
  );
}

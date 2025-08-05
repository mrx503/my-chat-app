
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, setDoc, getDocs, orderBy, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, User, AppNotification } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import ChatList from "@/components/chat-list";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import AppHeader from '@/components/app-header';
import NotificationPermissionHandler from '@/components/notification-permission-handler';
import Sidebar from '@/components/sidebar';
import { cn } from '@/lib/utils';
import SystemChatCard from '@/components/system-chat-card';

const SYSTEM_BOT_UID = 'system-bot-uid';

export default function ChatsPage() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    const chatsQuery = query(
        collection(db, 'chats'), 
        where('users', 'array-contains', currentUser.uid),
        orderBy('lastMessageTimestamp', 'desc')
    );
    
    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
        const chatsDataPromises = snapshot.docs.map(async (docSnapshot) => {
            const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
            if (chatData.deletedFor?.includes(currentUser.uid)) return null;

            // Skip system chat, it's handled on the main page now
            if (chatData.users.includes(SYSTEM_BOT_UID)) return null;

            const contactId = chatData.users.find(uid => uid !== currentUser.uid);

            if (contactId) {
                const userDocRef = doc(db, 'users', contactId);
                const userDoc = await getDoc(userDocRef);
                chatData.contact = userDoc.exists() 
                    ? { id: userDoc.id, ...userDoc.data() } as User
                    : { id: contactId, uid: contactId, name: `User ${contactId.substring(0, 4)}`, email: 'Unknown', avatar: `https://placehold.co/100x100.png`, coins: 0 };
            }
            
            const unreadCount = chatData.unreadCount?.[currentUser.uid] ?? 0;
            chatData.unreadMessages = unreadCount;

            return chatData;
        });
    
        const allChats = (await Promise.all(chatsDataPromises)).filter((c): c is Chat => c !== null);
        setUserChats(allChats);

        if(loading) setLoading(false);
    }, (error) => {
        console.error("Error fetching chats:", error);
        toast({variant: 'destructive', title: 'Error fetching chats'})
        setLoading(false);
    });


    return () => {
        unsubscribeChats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, router, toast]);

  const handleChatSelect = (chat: Chat) => {
    router.push(`/chat/${chat.id}`);
  };

  const handleSearchAndCreateChat = async () => {
    if (!searchUserId.trim() || !currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a user ID.' });
        return;
    }
    if (searchUserId.trim() === currentUser.uid) {
        toast({ variant: 'destructive', title: 'Error', description: "You can't start a chat with yourself." });
        return;
    }

    try {
        const userDocRef = doc(db, 'users', searchUserId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            toast({ variant: 'destructive', title: 'User not found', description: 'The user ID does not exist.' });
            return;
        }
        
        const existingChat = userChats.find(chat => chat.users.includes(searchUserId));
        if(existingChat) {
            router.push(`/chat/${existingChat.id}`);
            return;
        }

        const now = serverTimestamp();
        const newChatRef = await addDoc(collection(db, 'chats'), {
            users: [currentUser.uid, searchUserId].sort(),
            createdAt: now,
            encrypted: false,
            deletedFor: [],
            lastMessageTimestamp: now,
            lastMessageText: '',
            unreadCount: { [currentUser.uid]: 0, [searchUserId]: 0 }
        });
        
        router.push(`/chat/${newChatRef.id}`);

    } catch (error) {
        console.error("Error creating chat:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new chat.' });
    }
  };

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
             {/* The AppHeader on this page no longer needs notification/system props */}
            <AppHeader 
                systemUnreadCount={0}
                onSystemChatSelect={() => {
                     // Find the system chat and navigate, logic now primarily on home page
                    const findAndGo = async () => {
                        const chatQuery = query(collection(db, 'chats'), where('users', '==', [currentUser.uid, SYSTEM_BOT_UID].sort()));
                        const chatSnapshot = await getDocs(chatQuery);
                        if (!chatSnapshot.empty) {
                           router.push(`/chat/${chatSnapshot.docs[0].id}`);
                        } else {
                           toast({ title: 'No System Messages Yet'});
                        }
                    }
                    findAndGo();
                }}
                notifications={[]}
                unreadNotificationsCount={0}
                onMarkNotificationsRead={() => {}}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto grid grid-cols-1 gap-8">
                    <div>
                        <NotificationPermissionHandler />
                        <Card>
                            <CardHeader>
                                <CardTitle>Start or Continue a Chat</CardTitle>
                                <CardDescription>Enter a user ID or select a conversation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Enter user ID..."
                                        value={searchUserId}
                                        onChange={(e) => setSearchUserId(e.target.value)}
                                    />
                                    <Button onClick={handleSearchAndCreateChat} aria-label="Start Chat">
                                    <MessageSquarePlus className="h-4 w-4"/>
                                    </Button>
                                </div>
                                {userChats.length > 0 ? (
                                    <ChatList chats={userChats} onChatSelect={handleChatSelect} />
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">You have no active chats with users.</p>
                                        <p className="text-sm text-muted-foreground">Start one by entering a user ID.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
}

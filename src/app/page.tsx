
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import ChatList from "@/components/chat-list";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Copy, LogOut, MessageSquarePlus, User as UserIcon } from 'lucide-react';

export default function Home() {
  const { currentUser, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const chatsCollection = collection(db, 'chats');
    const q = query(chatsCollection, where('users', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
        
        const contactId = chatData.users.find(uid => uid !== currentUser.uid);
        
        if (contactId) {
            const userDocRef = doc(db, 'users', contactId);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()) {
                 chatData.contact = { id: userDoc.id, ...userDoc.data() } as User;
            } else {
                 chatData.contact = {
                    id: contactId,
                    name: `User ${contactId.substring(0, 4)}`,
                    email: 'Unknown',
                    avatar: `https://placehold.co/100x100.png`,
                };
            }
        }
        
        return chatData;
      }));
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, router]);
  
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
        
        const existingChat = chats.find(chat => chat.users.includes(searchUserId));
        if(existingChat) {
            router.push(`/chat/${existingChat.id}`);
            return;
        }

        const newChatRef = await addDoc(collection(db, 'chats'), {
            users: [currentUser.uid, searchUserId],
            createdAt: new Date(),
        });
        
        router.push(`/chat/${newChatRef.id}`);

    } catch (error) {
        console.error("Error creating chat:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new chat.' });
    }
  };
  
  const copyUserId = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      toast({ title: 'Copied!', description: 'Your full user ID has been copied to the clipboard.' });
    }
  };
  
  const shortUserId = currentUser?.uid ? `${currentUser.uid.substring(0, 6)}...` : '';

  if (!currentUser || loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background">
             <div className="flex flex-col items-center gap-2">
                <MessageSquarePlus className="w-12 h-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading your chats...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30">
        <header className="flex items-center justify-between p-4 bg-background border-b shadow-sm">
            <h1 className="text-xl font-bold text-primary">duck</h1>
            <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <UserIcon className="w-10 h-10 text-primary"/>
                            <div>
                                <CardTitle>{currentUser.name || currentUser.email}</CardTitle>
                                <CardDescription>Welcome back!</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                <span className="text-sm font-mono text-muted-foreground" title={currentUser.uid}>
                                    ID: {shortUserId}
                                </span>
                                <Button variant="ghost" size="icon" onClick={copyUserId} className="h-8 w-8">
                                    <Copy className="h-4 w-4"/>
                                    <span className="sr-only">Copy User ID</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Start a New Chat</CardTitle>
                            <CardDescription>Enter a user ID to begin a conversation.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                             <CardTitle>Your Chats</CardTitle>
                             <CardDescription>Select a conversation to continue messaging.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chats.length > 0 ? (
                                <ChatList chats={chats} onChatSelect={handleChatSelect} />
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">You have no active chats.</p>
                                    <p className="text-sm text-muted-foreground">Start one by entering a user ID.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}

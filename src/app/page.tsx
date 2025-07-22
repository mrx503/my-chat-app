
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, LogOut, MessageSquarePlus } from 'lucide-react';

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
        
        // Check if chat already exists
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
      toast({ title: 'Copied!', description: 'Your user ID has been copied to the clipboard.' });
    }
  };

  if (!currentUser || loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Loading...</p>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6">
        <header className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
                <h1 className="text-2xl font-bold">Welcome, {currentUser.email}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>Your ID: {currentUser.uid}</span>
                    <Button variant="ghost" size="icon" onClick={copyUserId} className="h-6 w-6">
                        <Copy className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
            <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
        </header>

        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Start a New Chat</CardTitle>
                <CardDescription>Enter the user ID of the person you want to chat with.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter user ID..."
                        value={searchUserId}
                        onChange={(e) => setSearchUserId(e.target.value)}
                    />
                    <Button onClick={handleSearchAndCreateChat}>
                       <MessageSquarePlus className="mr-2 h-4 w-4"/> Chat
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <h2 className="text-xl font-semibold mb-4">Your Chats</h2>
        {chats.length > 0 ? (
             <ChatList chats={chats} onChatSelect={handleChatSelect} />
        ) : (
            <p className="text-muted-foreground text-center mt-4">You have no active chats. Start one above!</p>
        )}
    </div>
  );
}

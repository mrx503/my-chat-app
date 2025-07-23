
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import ChatList from "@/components/chat-list";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, LogOut, MessageSquarePlus, Camera, Coins, Clapperboard } from 'lucide-react';

export default function Home() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

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
                    uid: contactId,
                    name: `User ${contactId.substring(0, 4)}`,
                    email: 'Unknown',
                    avatar: `https://placehold.co/100x100.png`,
                    coins: 0,
                };
            }
        } else {
             // Handle case with no contact (e.g. chat with self, which shouldn't happen)
             chatData.contact = {
                id: 'unknown',
                uid: 'unknown',
                name: 'Unknown User',
                email: 'Unknown',
                avatar: `https://placehold.co/100x100.png`,
                coins: 0,
            };
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
            createdAt: serverTimestamp(),
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL(file.type, quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      try {
        const base64 = await compressImage(file);
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { avatar: base64 });
        updateCurrentUser({ avatar: base64 });
        toast({ title: 'Success', description: 'Profile picture updated!' });
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile picture.' });
      }
    }
    event.target.value = '';
  };

  const handleWatchAd = async () => {
    if (!currentUser) return;
    setIsWatchingAd(true);
    toast({ title: 'Watching Ad...', description: 'Please wait while the ad plays.' });

    // Simulate ad delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const coinsEarned = Math.floor(Math.random() * 10) + 1;
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    try {
      await updateDoc(userDocRef, {
        coins: increment(coinsEarned)
      });
      // No need to call updateCurrentUser, onSnapshot will do it
      toast({ title: 'Congratulations!', description: `You earned ${coinsEarned} coins!` });
    } catch (error) {
      console.error("Error updating coins:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update your coin balance.' });
    } finally {
      setIsWatchingAd(false);
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
                            <div className="relative">
                                <Avatar className="w-16 h-16" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                                    <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                                    <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background cursor-pointer" onClick={handleAvatarClick}>
                                    <Camera className="h-4 w-4 text-primary-foreground"/>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
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
                            <div className="flex items-center gap-3">
                                <Coins className="h-8 w-8 text-amber-500"/>
                                <div>
                                    <CardTitle>My Wallet</CardTitle>
                                    <CardDescription>Your current coin balance.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg">
                                <span className="text-3xl font-bold text-amber-600">{currentUser.coins || 0}</span>
                                <Coins className="h-8 w-8 text-amber-500/50"/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleWatchAd} disabled={isWatchingAd}>
                                <Clapperboard className="mr-2 h-4 w-4"/>
                                {isWatchingAd ? 'Watching Ad...' : 'Watch an Ad & Earn Coins'}
                            </Button>
                        </CardFooter>
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

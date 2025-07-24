
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, writeBatch, setDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, User, Message } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import ChatList from "@/components/chat-list";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, LogOut, MessageSquarePlus, Camera, Wallet } from 'lucide-react';
import SystemChatCard from '@/components/system-chat-card';
import { Label } from '@/components/ui/label';

const SYSTEM_BOT_UID = 'system-bot-uid';

export default function Home() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const [systemChat, setSystemChat] = useState<Chat | null>(null);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const processedMessagesRef = useRef<string[]>([]);


  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const chatsCollection = collection(db, 'chats');
    const q = query(chatsCollection, where('users', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsDataPromises = snapshot.docs.map(async (docSnapshot) => {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
        
        const isSystemChat = chatData.users.includes(SYSTEM_BOT_UID);
        const contactId = isSystemChat 
            ? SYSTEM_BOT_UID 
            : chatData.users.find(uid => uid !== currentUser.uid);

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
        }
        
        // Fetch messages to calculate unread count for system chat
        if (isSystemChat) {
            const messagesQuery = query(collection(db, 'chats', chatData.id, 'messages'), where('senderId', '==', SYSTEM_BOT_UID), where('status', '!=', 'read'));
            const messagesSnapshot = await getDocs(messagesQuery);
            chatData.contact.unreadMessages = messagesSnapshot.size;
        }

        return chatData;
      });
      
      const allChats = await Promise.all(chatsDataPromises);
      
      const sysChat = allChats.find(c => c.users.includes(SYSTEM_BOT_UID)) || null;
      const regularChats = allChats.filter(c => !c.users.includes(SYSTEM_BOT_UID));

      setSystemChat(sysChat);
      setSystemUnreadCount(sysChat?.contact?.unreadMessages || 0);
      setUserChats(regularChats);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, router]);
  
  // Effect to handle unclaimed messages from the system queue
  useEffect(() => {
      const deliverQueuedMessages = async () => {
          if (!currentUser || !currentUser.systemMessagesQueue || currentUser.systemMessagesQueue.length === 0) {
              return;
          }

          const messagesToProcess = currentUser.systemMessagesQueue.filter(
              msg => !processedMessagesRef.current.includes(msg)
          );

          if (messagesToProcess.length === 0) {
              return;
          }

          processedMessagesRef.current = [...processedMessagesRef.current, ...messagesToProcess];

          try {
              let chatRef;
              if (systemChat) {
                chatRef = doc(db, 'chats', systemChat.id);
              } else {
                 // Find or create the system chat
                const chatsQuery = query(
                    collection(db, 'chats'),
                    where('users', 'in', [[currentUser.uid, SYSTEM_BOT_UID], [SYSTEM_BOT_UID, currentUser.uid]])
                );
                const chatSnapshot = await getDocs(chatsQuery);

                if (!chatSnapshot.empty) {
                    chatRef = chatSnapshot.docs[0].ref;
                } else {
                    chatRef = doc(collection(db, 'chats'));
                    await setDoc(chatRef, {
                        users: [currentUser.uid, SYSTEM_BOT_UID].sort(),
                        createdAt: serverTimestamp(),
                    });
                }
              }

              const batch = writeBatch(db);
              const messagesColRef = collection(chatRef, 'messages');

              for (const messageText of messagesToProcess) {
                  const messageRef = doc(messagesColRef);
                  batch.set(messageRef, {
                      senderId: SYSTEM_BOT_UID,
                      text: messageText,
                      timestamp: serverTimestamp(),
                      type: 'text',
                      status: 'sent'
                  });
              }
              
              const userDocRef = doc(db, 'users', currentUser.uid);
              batch.update(userDocRef, { systemMessagesQueue: [] });

              await batch.commit();
              updateCurrentUser({ systemMessagesQueue: [] });
              
              toast({
                  title: 'You have new system messages!',
                  description: 'Check your system messages for details.',
              });

          } catch (error) {
              console.error("Error delivering queued messages:", error);
              processedMessagesRef.current = processedMessagesRef.current.filter(
                  pMsg => !messagesToProcess.includes(pMsg)
              );
          }
      };

      deliverQueuedMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, systemChat]);


  const handleChatSelect = (chat: Chat) => {
    router.push(`/chat/${chat.id}`);
  };
  
   const handleSystemChatSelect = () => {
    if (systemChat) {
      router.push(`/chat/${systemChat.id}`);
    } else {
      toast({
        title: 'No System Messages',
        description: 'You do not have any system messages yet.',
      });
    }
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

        const newChatRef = await addDoc(collection(db, 'chats'), {
            users: [currentUser.uid, searchUserId].sort(),
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
        toast({ title: 'Uploading...', description: 'Please wait while we update your picture.' });
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
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                                    <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background cursor-pointer">
                                    <Camera className="h-4 w-4 text-primary-foreground"/>
                                </Label>
                                <Input id="avatar-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                            <div>
                                <CardTitle>{currentUser.name || currentUser.email}</CardTitle>
                                <CardDescription>Welcome back!</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-between p-3 bg-muted rounded-md mb-4">
                                <span className="text-sm font-mono text-muted-foreground" title={currentUser.uid}>
                                    ID: {shortUserId}
                                 </span>
                                <Button variant="ghost" size="icon" onClick={copyUserId} className="h-8 w-8">
                                    <Copy className="h-4 w-4"/>
                                    <span className="sr-only">Copy User ID</span>
                                </Button>
                            </div>
                            <Button className="w-full" onClick={() => router.push('/wallet')}>
                                <Wallet className="mr-2 h-4 w-4"/>
                                View Wallet
                            </Button>
                        </CardContent>
                    </Card>

                    <SystemChatCard 
                        unreadCount={systemUnreadCount}
                        onClick={handleSystemChatSelect}
                    />
                </div>

                <div className="lg:col-span-2">
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
  );
}

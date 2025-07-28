
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp, setDoc, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, User, Message } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import ChatList from "@/components/chat-list";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, MessageSquarePlus } from 'lucide-react';
import SystemChatCard from '@/components/system-chat-card';
import ProfileCard from '@/components/profile-card';
import Logo from '@/components/logo';
import NotificationPermissionHandler from '@/components/notification-permission-handler';

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
        
        if (chatData.deletedFor?.includes(currentUser.uid)) {
          return null;
        }

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
        
        const messagesQuery = query(
          collection(db, 'chats', chatData.id, 'messages'), 
          orderBy('timestamp', 'desc')
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        
        let unreadCount = 0;
        let lastMessageText = '';
        let lastMessageTimestamp: any = chatData.createdAt;

        if (!messagesSnapshot.empty) {
            const messages = messagesSnapshot.docs.map(d => d.data() as Message);
            lastMessageText = messages[0].text || messages[0].type || '...';
            lastMessageTimestamp = messages[0].timestamp;
            
            unreadCount = messages.filter(
                (msg) => msg.senderId !== currentUser.uid && msg.status !== 'read'
            ).length;
        }

        chatData.contact.unreadMessages = unreadCount;
        chatData.contact.lastMessage = lastMessageText;
        chatData.contact.lastMessageTimestamp = lastMessageTimestamp;
        
        if (isSystemChat) {
          setSystemUnreadCount(unreadCount);
        }

        return chatData;
      });
      
      const allChats = (await Promise.all(chatsDataPromises)).filter((c): c is Chat => c !== null);
      
      const sysChat = allChats.find(c => c.users.includes(SYSTEM_BOT_UID)) || null;
      const regularChats = allChats.filter(c => !c.users.includes(SYSTEM_BOT_UID));

      setSystemChat(sysChat);
      setUserChats(regularChats);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, router]);
  
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
              const chatQuery = query(collection(db, 'chats'), where('users', '==', [currentUser.uid, SYSTEM_BOT_UID].sort()));
              const chatSnapshot = await getDocs(chatQuery);
              let chatRef;

              if (!chatSnapshot.empty) {
                  chatRef = chatSnapshot.docs[0].ref;
              } else {
                  chatRef = doc(collection(db, 'chats'));
                  await setDoc(chatRef, {
                      users: [currentUser.uid, SYSTEM_BOT_UID].sort(),
                      createdAt: serverTimestamp(),
                      encrypted: false,
                      deletedFor: [],
                  });
              }
              
              const messagesColRef = collection(chatRef, 'messages');
              for (const messageText of messagesToProcess) {
                  await addDoc(messagesColRef, {
                      senderId: SYSTEM_BOT_UID,
                      text: messageText,
                      timestamp: serverTimestamp(),
                      type: 'text',
                      status: 'sent'
                  });
              }
              
              const userDocRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userDocRef, { systemMessagesQueue: [] });
              
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
            encrypted: false,
            deletedFor: [],
        });
        
        router.push(`/chat/${newChatRef.id}`);

    } catch (error) {
        console.error("Error creating chat:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a new chat.' });
    }
  };

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
        <header className="hidden lg:flex items-center justify-between p-4 bg-background border-b shadow-sm">
            <div className="flex items-center gap-2">
                <Logo className="h-8 w-8" />
                <h1 className="text-xl font-bold text-primary">duck</h1>
            </div>
            <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-0 md:p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <ProfileCard 
                    currentUser={currentUser}
                    updateCurrentUser={updateCurrentUser}
                    logout={logout}
                />

                <div className="lg:col-span-2 p-4 md:p-0">
                     <SystemChatCard 
                        unreadCount={systemUnreadCount}
                        onClick={handleSystemChatSelect}
                        className="mb-6"
                    />
                    <NotificationPermissionHandler />
                    <Card className="mt-6">
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

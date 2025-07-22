
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, Message, User } from '@/lib/types';
import ChatArea from '@/components/chat-area';
import { Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const chatId = params.chatId as string;

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (!chatId) return;

        const chatDocRef = doc(db, 'chats', chatId);
        const unsubscribeChat = onSnapshot(chatDocRef, async (chatDoc) => {
            if (chatDoc.exists()) {
                const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;

                // Security check: ensure current user is part of the chat
                if (!chatData.users.includes(currentUser.uid)) {
                    console.error("Access denied: User not in chat.");
                    setChat(null);
                    setLoading(false);
                    router.push('/');
                    return;
                }
                
                 const contactId = chatData.users.find(id => id !== currentUser.uid);
                 if(contactId) {
                    const contactDocRef = doc(db, 'users', contactId);
                    const contactDoc = await getDoc(contactDocRef);
                    if (contactDoc.exists()) {
                        chatData.contact = { id: contactDoc.id, ...contactDoc.data() } as User;
                    }
                    setChat(chatData);
                    setLoading(false);
                 }
            } else {
                setLoading(false);
            }
        });

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesColRef, orderBy('timestamp', 'asc'));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(newMessages);
        });

        setIsEncrypted(false);

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    }, [chatId, currentUser, router]);

    const handleNewMessage = async (messageText: string) => {
        if (!chatId || !messageText.trim() || !currentUser) return;

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesColRef, {
            text: messageText,
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
        });
    };

    if (loading) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot size={80} className="text-muted-foreground/50 mb-4 animate-pulse" />
                <h1 className="text-2xl font-semibold">Loading Chat...</h1>
                <p className="text-muted-foreground">Please wait while we fetch your conversation.</p>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot size={80} className="text-muted-foreground/50 mb-4" />
                <h1 className="text-2xl font-semibold">Chat not found</h1>
                <p className="text-muted-foreground">The requested chat does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 flex flex-col bg-muted/30">
                <ChatArea
                  chat={{ ...chat, messages }}
                  onNewMessage={handleNewMessage}
                  isEncrypted={isEncrypted}
                  setIsEncrypted={setIsEncrypted}
                />
            </main>
        </div>
    );
}

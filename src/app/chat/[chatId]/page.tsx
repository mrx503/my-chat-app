
"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, Message, User } from '@/lib/types';
import { currentUser } from '@/lib/data';
import ChatArea from '@/components/chat-area';
import { Bot } from 'lucide-react';

export default function ChatPage() {
    const params = useParams();
    const chatId = params.chatId as string;

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId) return;

        const chatDocRef = doc(db, 'chats', chatId);
        const unsubscribeChat = onSnapshot(chatDocRef, (doc) => {
            if (doc.exists()) {
                const chatData = { id: doc.id, ...doc.data() } as Chat;
                 // We need to fetch the contact details separately
                 const contactId = chatData.users.find(id => id !== currentUser.id);
                 if(contactId) {
                    const contactDocRef = doc(db, 'users', contactId);
                    const unsubscribeContact = onSnapshot(contactDocRef, (contactDoc) => {
                        if (contactDoc.exists()) {
                            chatData.contact = { id: contactDoc.id, ...contactDoc.data() } as User;
                        }
                        setChat(chatData);
                        setLoading(false);
                    });
                    return () => unsubscribeContact();
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

        // Reset encryption state when chat changes
        setIsEncrypted(false);

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    }, [chatId]);

    const handleNewMessage = async (messageText: string) => {
        if (!chatId || !messageText.trim()) return;

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesColRef, {
            text: messageText,
            senderId: currentUser.id,
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

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 flex flex-col bg-muted/30">
                {chat ? (
                    <ChatArea
                      chat={{ ...chat, messages }}
                      onNewMessage={handleNewMessage}
                      isEncrypted={isEncrypted}
                      setIsEncrypted={setIsEncrypted}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot size={80} className="text-muted-foreground/50 mb-4" />
                        <h1 className="text-2xl font-semibold">Chat not found</h1>
                        <p className="text-muted-foreground">The requested chat does not exist or could not be loaded.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

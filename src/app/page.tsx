
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { currentUser } from '@/lib/data';
import type { Chat } from '@/lib/types';

import ChatList from "@/components/chat-list";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const chatsCollection = collection(db, 'chats');
    const q = query(chatsCollection, where('users', 'array-contains', currentUser.id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const chatData = { id: doc.id, ...doc.data() } as Chat;
        
        // Find the other user's ID
        const contactId = chatData.users.find(uid => uid !== currentUser.id);
        
        // This is a simplified version. In a real app, you'd fetch contact details.
        // For now, we'll just use a placeholder name.
        if (contactId) {
            chatData.contact = {
                id: contactId,
                name: `User ${contactId.substring(0, 4)}`,
                avatar: `https://placehold.co/100x100.png`,
            };
        }
        
        return chatData;
      }));
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChatSelect = (chat: Chat) => {
    router.push(`/chat/${chat.id}`);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Loading chats...</p>
        </div>
    )
  }

  return <ChatList chats={chats} onChatSelect={handleChatSelect} />;
}

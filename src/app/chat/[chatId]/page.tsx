"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import type { Chat } from '@/lib/types';
import { chats as initialChats, currentUser } from '@/lib/data';
import ChatArea from '@/components/chat-area';
import { Bot } from 'lucide-react';
import ChatList from '@/components/chat-list';

export default function ChatPage() {
    const params = useParams();
    const chatId = params.chatId as string;

    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    
    useEffect(() => {
        const chat = chats.find(c => c.id === chatId);
        setSelectedChat(chat || null);
    }, [chatId, chats]);

    const handleNewMessage = (chatId: string, message: string) => {
        const newMessage = { id: Date.now().toString(), text: message, senderId: currentUser.id, timestamp: Date.now() };
        
        const updateChat = (chat: Chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    contact: {
                        ...chat.contact,
                        lastMessage: message,
                        lastMessageTimestamp: newMessage.timestamp,
                    }
                };
            }
            return chat;
        };
        
        setChats(prevChats => prevChats.map(updateChat));
    
        if (selectedChat?.id === chatId) {
            setSelectedChat(prev => prev ? updateChat(prev) : null);
        }
    };

    const sidebarContent = <ChatList />;
    
    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <aside className="hidden md:flex">
                {sidebarContent}
            </aside>
            <main className="flex-1 flex flex-col bg-muted/30">
                {selectedChat ? (
                    <ChatArea chat={selectedChat} onNewMessage={handleNewMessage} sidebar={sidebarContent} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot size={80} className="text-muted-foreground/50 mb-4" />
                        <h1 className="text-2xl font-semibold">Select a chat</h1>
                        <p className="text-muted-foreground">Choose a conversation from the list.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

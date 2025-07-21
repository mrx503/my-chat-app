"use client"

import React, { useState, useEffect } from 'react';
import { Bot, MessageSquareText, Search, Menu } from 'lucide-react';

import type { Chat } from '@/lib/types';
import { chats as initialChats } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ChatArea from '@/components/chat-area';
import { ThemeSwitcher } from './theme-switcher';
import { ScrollArea } from './ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from './ui/button';

function ChatList({ chats, selectedChat, onChatSelect, searchQuery, onSearchChange }: {
  chats: Chat[],
  selectedChat: Chat | null,
  onChatSelect: (chat: Chat) => void,
  searchQuery: string,
  onSearchChange: (query: string) => void
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredChats = chats
    .filter(chat => chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.contact.lastMessageTimestamp || 0) - (a.contact.lastMessageTimestamp || 0));

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    if (!isClient) return ''; // Avoid hydration mismatch

    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = (now.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US');
    }
  }

  return (
    <div className="w-[340px] flex-shrink-0 border-r border-border flex flex-col">
      <div className="p-4 space-y-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageSquareText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline">duck</h1>
          </div>
          <ThemeSwitcher />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={cn(
                'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors',
                selectedChat?.id === chat.id ? 'bg-muted' : 'hover:bg-muted/50',
              )}
            >
              <Avatar className="h-12 w-12 border-2 border-transparent data-[online=true]:border-green-500" data-online={chat.contact.online}>
                <AvatarImage src={chat.contact.avatar} alt={chat.contact.name} data-ai-hint="profile picture" />
                <AvatarFallback>{chat.contact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold truncate">{chat.contact.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{chat.contact.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end space-y-1 self-start">
                <span className="text-xs text-muted-foreground">{formatTimestamp(chat.contact.lastMessageTimestamp)}</span>
                {chat.contact.unreadMessages && chat.contact.unreadMessages > 0 && (
                  <Badge className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center p-0">{chat.contact.unreadMessages}</Badge>
                )}
              </div>
            </button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}


export default function MurrasilChat() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setIsSidebarOpen(false); // Close sidebar on selection in mobile
  };

  const handleNewMessage = (chatId: string, message: string) => {
    const newMessage = { id: Date.now().toString(), text: message, senderId: 'user0', timestamp: Date.now() };
    
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
  }

  const sidebarContent = (
    <ChatList 
      chats={chats}
      selectedChat={selectedChat}
      onChatSelect={handleChatSelect}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  );


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
            <h1 className="text-2xl font-semibold">Welcome to duck</h1>
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}

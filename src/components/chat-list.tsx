"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MessageSquareText, Search } from 'lucide-react';

import type { Chat } from '@/lib/types';
import { chats as initialChats } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from './theme-switcher';
import { ScrollArea } from './ui/scroll-area';

export default function ChatList() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const params = useParams();
  const selectedChatId = params.chatId as string;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChatSelect = (chat: Chat) => {
    router.push(`/chat/${chat.id}`);
  };

  const filteredChats = chats
    .filter(chat => chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.contact.lastMessageTimestamp || 0) - (a.contact.lastMessageTimestamp || 0));

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    if (!isClient) return '';

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
    <div className="w-full md:w-[340px] md:flex-shrink-0 border-r border-border flex flex-col h-screen bg-background">
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={cn(
                'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors',
                selectedChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50',
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

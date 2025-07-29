
"use client"

import React, { useState, useEffect } from 'react';
import type { Chat } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';


interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
}


export default function ChatList({ chats, onChatSelect }: ChatListProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Chats are now pre-sorted by the Firestore query
  const sortedChats = chats;

  const formatTimestamp = (timestamp?: any) => {
    if (!timestamp || !isClient) return '';

    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffDays = (now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24);

        if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        } else if (diffDays === 1) {
        return 'Yesterday';
        } else {
        return date.toLocaleDateString('en-US');
        }
    } catch (e) {
        // Handle cases where timestamp might not be a Firestore timestamp yet
        // during new chat creation before first message.
        return '';
    }
  }
  
  return (
    <ScrollArea className="flex-1 rounded-md border">
        <div className="p-2 space-y-1">
          {sortedChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={cn(
                'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50'
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.contact.avatar} alt={chat.contact.name} data-ai-hint="profile picture" />
                  <AvatarFallback>{chat.contact.name ? chat.contact.name.charAt(0) : 'U'}</AvatarFallback>
                </Avatar>
                {chat.contact.online && chat.contact.privacySettings?.showOnlineStatus && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold truncate">{chat.contact.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessageText || 'No messages yet'}</p>
              </div>
              <div className="flex flex-col items-end space-y-1 self-start">
                <span className="text-xs text-muted-foreground">{formatTimestamp(chat.lastMessageTimestamp)}</span>
                {chat.unreadMessages && chat.unreadMessages > 0 && (
                  <Badge className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center p-0">{chat.unreadMessages}</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
    </ScrollArea>
  );
}

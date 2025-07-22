
"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
  isEncrypted: boolean;
}

function FormattedTime({ timestamp }: { timestamp: any }) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        let timeStr = '';
        if (timestamp && typeof timestamp.toDate === 'function') {
            timeStr = new Date(timestamp.toDate()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else {
             // Fallback for locally created messages before they get a server timestamp
            timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        setFormattedTime(timeStr);
    }, [timestamp]);

    if (!formattedTime) {
        return null;
    }

    return <>{formattedTime}</>;
}

const encryptMessage = (text: string) => {
  return text.split('').map(char => char.charCodeAt(0)).join(' ');
}

export default function MessageList({ messages, contactAvatar, isEncrypted }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isEncrypted]);
  
  if (!currentUser) {
    return null; // or a loading state
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-6 space-y-6">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser.uid;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          const messageText = isEncrypted ? encryptMessage(message.text) : message.text;

          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}
            >
              {!isCurrentUser && (
                <Avatar className={cn('h-8 w-8', showAvatar ? 'opacity-100' : 'opacity-0')}>
                   {showAvatar && <AvatarImage src={contactAvatar} alt="Contact Avatar" data-ai-hint="profile picture"/>}
                   {showAvatar && <AvatarFallback>C</AvatarFallback>}
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm shadow-sm break-words',
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-background text-foreground rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{messageText}</p>
                <p className="text-xs mt-1 text-right opacity-70">
                  <FormattedTime timestamp={message.timestamp} />
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}


"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { Button } from './ui/button';

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

const MessageContent = ({ message, isEncrypted }: { message: Message; isEncrypted: boolean }) => {
    const messageText = isEncrypted && message.text ? encryptMessage(message.text) : message.text;

    switch (message.type) {
        case 'image':
            return (
                <div className="relative w-64 h-64">
                    <a href={message.fileURL} target="_blank" rel="noopener noreferrer">
                        <Image
                            src={message.fileURL!}
                            alt={message.fileName || 'Sent image'}
                            layout="fill"
                            className="rounded-lg object-cover"
                            data-ai-hint="sent image"
                        />
                    </a>
                </div>
            );
        case 'file':
            return (
                <a href={message.fileURL} target="_blank" rel="noopener noreferrer" download={message.fileName}>
                    <Button variant="outline" className="h-auto">
                        <div className="flex items-center gap-3 py-2 px-3">
                            <Download className="h-6 w-6" />
                            <div className="text-left">
                                <p className="font-semibold">{message.fileName}</p>
                                <p className="text-xs text-muted-foreground">Click to download</p>
                            </div>
                        </div>
                    </Button>
                </a>
            );
        default:
            return <p className="whitespace-pre-wrap break-words">{messageText}</p>;
    }
};

export default function MessageList({ messages, contactAvatar, isEncrypted }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isEncrypted]);
  
  if (!currentUser) {
    return null; // or a loading state
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="p-6 space-y-2">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser.uid;
          const showAvatar = index === messages.length -1 || messages[index + 1].senderId !== message.senderId;
          
          return (
            <div
              key={message.id}
              className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}
            >
              {!isCurrentUser && (
                <Avatar className={cn('h-8 w-8 self-end', showAvatar ? 'opacity-100' : 'opacity-0')}>
                   {showAvatar && <AvatarImage src={contactAvatar} alt="Contact Avatar" data-ai-hint="profile picture"/>}
                   {showAvatar && <AvatarFallback>C</AvatarFallback>}
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[70%] rounded-xl shadow-sm break-words group',
                   isCurrentUser
                    ? `bg-primary text-primary-foreground rounded-br-none ${message.type === 'image' ? 'p-0 bg-transparent' : 'p-3'}`
                    : `bg-background text-foreground rounded-bl-none ${message.type === 'image' ? 'p-0' : 'p-3'}`
                )}
              >
                <MessageContent message={message} isEncrypted={isEncrypted} />
                 {message.type !== 'image' && (
                    <p className="text-xs mt-1 text-right opacity-70">
                        <FormattedTime timestamp={message.timestamp} />
                    </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}


"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Download, Check, CheckCheck } from 'lucide-react';
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
        } else if (timestamp) { // Fallback for server-generated timestamps before hydration
             try {
                // This might be a server timestamp object that isn't a Date object yet
                const date = new Date(timestamp.seconds * 1000);
                timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
             } catch(e) {
                timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
             }
        }
        setFormattedTime(timeStr);
    }, [timestamp]);

    if (!formattedTime) {
        return null;
    }

    return <>{formattedTime}</>;
}

const ReadReceipt = ({ status }: { status?: 'sent' | 'read' }) => {
    if (status === 'sent') {
        return <Check className="h-4 w-4 ml-1" />;
    }
    if (status === 'read') {
        return <CheckCheck className="h-4 w-4 ml-1 text-blue-500" />;
    }
    return null;
};

const encryptMessage = (text: string) => {
  return text.split('').map(char => char.charCodeAt(0)).join(' ');
}

const MessageContent = ({ message, isEncrypted }: { message: Message; isEncrypted: boolean }) => {
    const messageText = isEncrypted && message.text ? encryptMessage(message.text) : message.text;

    switch (message.type) {
        case 'image':
             if (!message.fileURL) return null;
            return (
                 <a href={message.fileURL} target="_blank" rel="noopener noreferrer" className="block w-full max-w-xs">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                            src={message.fileURL}
                            alt={message.fileName || 'Sent image'}
                            fill
                            className="object-cover"
                            data-ai-hint="sent image"
                        />
                    </div>
                </a>
            );
        case 'file':
            if (!message.fileURL) return null;
            return (
                <a href={message.fileURL} target="_blank" rel="noopener noreferrer" download={message.fileName}>
                    <Button variant="outline" className="h-auto">
                        <div className="flex items-center gap-3 py-2 px-3">
                            <Download className="h-6 w-6" />
                            <div className="text-left">
                                <p className="font-semibold break-all">{message.fileName}</p>

                                <p className="text-xs text-muted-foreground">Click to download</p>
                            </div>
                        </div>
                    </Button>
                </a>
            );
        default:
             if (messageText) {
                return <p className="whitespace-pre-wrap break-words">{messageText}</p>;
            }
            return null;
    }
};

export default function MessageList({ messages, contactAvatar, isEncrypted }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isEncrypted]);
  
  if (!currentUser) {
    return null; 
  }

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="p-6 space-y-2">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser.uid;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          
          return (
            <div
              key={message.id || index}
              className={cn('flex items-end gap-3', isCurrentUser ? 'justify-end' : 'justify-start')}
            >
              {!isCurrentUser && (
                <Avatar className={cn('h-8 w-8 self-end', showAvatar ? 'opacity-100' : 'opacity-0')}>
                   {showAvatar && <AvatarImage src={contactAvatar} alt="Contact Avatar" data-ai-hint="profile picture"/>}
                   {showAvatar && <AvatarFallback>C</AvatarFallback>}
                </Avatar>
              )}
              <div className="w-full flex flex-col" style={{ alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                <div
                    className={cn(
                        'max-w-[70%] rounded-xl p-3 shadow-sm break-words group',
                        isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-background text-foreground rounded-bl-none',
                        { 'p-1': message.type === 'image' }
                    )}
                >
                    <MessageContent message={message} isEncrypted={isEncrypted} />
                </div>
                <div className="flex items-center text-xs mt-1 text-right opacity-70">
                    <FormattedTime timestamp={message.timestamp} />
                    {isCurrentUser && <ReadReceipt status={message.status} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

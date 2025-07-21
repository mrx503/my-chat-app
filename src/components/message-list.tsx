"use client"

import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { currentUser } from '@/lib/data';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
}

export default function MessageList({ messages, contactAvatar }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-6 space-y-6">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser.id;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

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
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm shadow-sm',
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-background text-foreground rounded-bl-none'
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs mt-1 text-right opacity-70">
                  {format(new Date(message.timestamp), 'p')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

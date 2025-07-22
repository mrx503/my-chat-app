
"use client";

import React from 'react';
import type { Chat } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  onNewMessage: (message: string) => void;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
  isBlocked: boolean;
  onDeleteChat: () => void;
  onBlockUser: () => void;
  isSelfBlocked: boolean;
}

export default function ChatArea({ chat, onNewMessage, isEncrypted, setIsEncrypted, isBlocked, onDeleteChat, onBlockUser, isSelfBlocked }: ChatAreaProps) {
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      onNewMessage(message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        contact={chat.contact} 
        isEncrypted={isEncrypted}
        setIsEncrypted={setIsEncrypted}
        onDeleteChat={onDeleteChat}
        onBlockUser={onBlockUser}
        isBlocked={isSelfBlocked}
      />
      <MessageList 
        messages={chat.messages} 
        contactAvatar={chat.contact.avatar} 
        isEncrypted={isEncrypted} 
      />
      {isBlocked ? (
         <div className="p-4 border-t bg-background">
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Conversation Blocked</AlertTitle>
                <AlertDescription>
                    {isSelfBlocked ? "You have blocked this user. Unblock them to send messages." : "You cannot reply to this conversation because you are blocked by the user."}
                </AlertDescription>
            </Alert>
         </div>
      ) : (
        <MessageInput onSendMessage={handleSendMessage} />
      )}
    </div>
  );
}

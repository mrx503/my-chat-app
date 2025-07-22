
"use client";

import React from 'react';
import type { Chat } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';

interface ChatAreaProps {
  chat: Chat;
  onNewMessage: (message: string) => void;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
}

export default function ChatArea({ chat, onNewMessage, isEncrypted, setIsEncrypted }: ChatAreaProps) {
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
      />
      <MessageList 
        messages={chat.messages} 
        contactAvatar={chat.contact.avatar} 
        isEncrypted={isEncrypted} 
      />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}

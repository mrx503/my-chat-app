"use client";

import React from 'react';
import type { Chat } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';

interface ChatAreaProps {
  chat: Chat;
  onNewMessage: (chatId: string, message: string) => void;
  sidebar: React.ReactNode;
}

export default function ChatArea({ chat, onNewMessage, sidebar }: ChatAreaProps) {
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      onNewMessage(chat.id, message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader contact={chat.contact}>{sidebar}</ChatHeader>
      <MessageList messages={chat.messages} contactAvatar={chat.contact.avatar} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}

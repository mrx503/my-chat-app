"use client";

import React from 'react';
import type { Chat } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';

interface ChatAreaProps {
  chat: Chat;
  onNewMessage: (chatId: string, message: string) => void;
}

export default function ChatArea({ chat, onNewMessage }: ChatAreaProps) {
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      onNewMessage(chat.id, message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader contact={chat.contact} />
      <MessageList messages={chat.messages} contactAvatar={chat.contact.avatar} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}

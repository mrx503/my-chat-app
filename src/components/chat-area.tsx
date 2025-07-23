
"use client";

import React from 'react';
import type { Chat } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  chat: Chat;
  onNewMessage: (message: string) => void;
  onSendFile: (file: File) => void;
  onSendVoiceMessage: (audioBase64: string) => void;
  onDeleteMessage: (messageId: string, type: 'me' | 'everyone') => void;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
  isBlocked: boolean;
  onDeleteChat: () => void;
  onBlockUser: () => void;
  isSelfBlocked: boolean;
}

export default function ChatArea({ chat, onNewMessage, onSendFile, onSendVoiceMessage, onDeleteMessage, isEncrypted, setIsEncrypted, isBlocked, onDeleteChat, onBlockUser, isSelfBlocked, className }: ChatAreaProps) {
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      onNewMessage(message);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 overflow-hidden", className)}>
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
        contactAvatar={chat.contact?.avatar} 
        onDeleteMessage={onDeleteMessage}
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
        <MessageInput 
          onSendMessage={handleSendMessage} 
          onSendFile={onSendFile}
          onSendVoiceMessage={onSendVoiceMessage}
        />
      )}
    </div>
  );
}

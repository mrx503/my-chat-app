
"use client";

import React from 'react';
import type { Chat, Message } from '@/lib/types';
import ChatHeader from './chat-header';
import MessageList from './message-list';
import MessageInput from './message-input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ShieldAlert, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReplyPreview from './reply-preview';

interface ChatAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  chat: Chat;
  messages: Message[];
  onNewMessage: (message: string) => void;
  onSendFile: (file: File) => void;
  onSendVoiceMessage: (audioBase64: string) => void;
  onDeleteMessage: (messageId: string, type: 'me' | 'everyone') => void;
  onReplyToMessage: (message: Message) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  onSetEncryption: (password: string) => void;
  onDecrypt: (password: string) => Promise<boolean>;
  isBlocked: boolean;
  onDeleteChat: () => void;
  onBlockUser: () => void;
  isSelfBlocked: boolean;
  isAutoReplyActive: boolean;
  onToggleAutoReply: () => void;
  isSystemChat: boolean;
}

export default function ChatArea({ 
    chat, messages, onNewMessage, onSendFile, onSendVoiceMessage, onDeleteMessage, 
    onReplyToMessage, replyingTo, setReplyingTo, 
    onSetEncryption, onDecrypt,
    isBlocked, onDeleteChat, onBlockUser, isSelfBlocked,
    isAutoReplyActive, onToggleAutoReply, isSystemChat, className 
}: ChatAreaProps) {
    
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      onNewMessage(message);
    }
  };

  const renderInputArea = () => {
    if (isSystemChat) {
      return (
        <div className="p-4 border-t bg-background">
          <Alert variant="default" className="border-primary/50 text-center">
              <Bot className="h-4 w-4" />
              <AlertTitle>System Messages</AlertTitle>
              <AlertDescription>
                  You cannot reply to system messages.
              </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (isBlocked) {
      return (
        <div className="p-4 border-t bg-background">
          <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Conversation Blocked</AlertTitle>
              <AlertDescription>
                  {isSelfBlocked ? "You have blocked this user. Unblock them to send messages." : "You cannot reply to this conversation because you are blocked by the user."}
              </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (chat.encrypted) {
      return (
          <div className="p-4 border-t bg-background">
              <Alert variant="default" className="border-amber-500/50 text-center">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Chat is Encrypted</AlertTitle>
                  <AlertDescription>
                      This chat is currently encrypted. Decrypt it from the header to send messages.
                  </AlertDescription>
              </Alert>
          </div>
      );
    }


    return (
      <div className="flex flex-col">
          {replyingTo && (
              <ReplyPreview 
                  message={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
              />
          )}
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onSendFile={onSendFile}
            onSendVoiceMessage={onSendVoiceMessage}
            isAutoReplyActive={isAutoReplyActive}
            onToggleAutoReply={onToggleAutoReply}
          />
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 overflow-hidden", className)}>
      <ChatHeader 
        contact={chat.contact} 
        isEncrypted={chat.encrypted ?? false}
        onSetEncryption={onSetEncryption}
        onDecrypt={onDecrypt}
        onDeleteChat={onDeleteChat}
        onBlockUser={onBlockUser}
        isBlocked={isSelfBlocked}
        isSystemChat={isSystemChat}
      />
      <MessageList 
        messages={messages} 
        contactAvatar={chat.contact?.avatar} 
        onDeleteMessage={onDeleteMessage}
        onReplyToMessage={onReplyToMessage}
        isEncrypted={chat.encrypted ?? false}
      />
      {renderInputArea()}
    </div>
  );
}
 

"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Download, Check, CheckCheck, Trash2, File } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
  isEncrypted: boolean;
  onDeleteMessage: (messageId: string, type: 'me' | 'everyone') => void;
}

function FormattedTime({ timestamp }: { timestamp: any }) {
    const [formattedTime, setFormattedTime] = useState('');

    useEffect(() => {
        let timeStr = '';
        if (timestamp && typeof timestamp.toDate === 'function') {
            timeStr = new Date(timestamp.toDate()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (timestamp) { 
             try {
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
    if (message.isDeleted) {
        return <p className="whitespace-pre-wrap break-words text-muted-foreground italic">This message was deleted</p>;
    }

    const messageText = isEncrypted && message.text ? encryptMessage(message.text) : message.text;

    switch (message.type) {
        case 'image':
             if (!message.fileURL) return null;
            return (
                <Image
                    src={message.fileURL}
                    alt={message.fileName || 'Sent image'}
                    width={240}
                    height={135}
                    className="rounded-md object-cover"
                    data-ai-hint="sent image"
                />
            );
        case 'file':
            if (!message.fileURL) return null;
            return (
                <a href={message.fileURL} target="_blank" rel="noopener noreferrer" download={message.fileName}>
                    <Button variant="outline" className="h-auto">
                        <div className="flex items-center gap-3 py-2 px-3">
                            <File className="h-6 w-6" />
                            <div className="text-left">
                                <p className="font-semibold break-all">{message.fileName}</p>
                                <p className="text-xs text-muted-foreground">Click to download</p>
                            </div>
                        </div>
                    </Button>
                </a>
            );
        case 'audio':
            if (!message.fileURL) return null;
            return (
                <audio controls src={message.fileURL} className="max-w-xs" />
            );
        default:
            return <p className="whitespace-pre-wrap break-words">{messageText}</p>;
    }
};


export default function MessageList({ messages, contactAvatar, isEncrypted, onDeleteMessage }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<{ id: string, type: 'me' | 'everyone' } | null>(null);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isEncrypted]);

  const handleDeleteRequest = (messageId: string, type: 'me' | 'everyone') => {
    setSelectedMessage({ id: messageId, type });
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = () => {
    if (selectedMessage) {
      onDeleteMessage(selectedMessage.id, selectedMessage.type);
      setShowDeleteDialog(false);
      setSelectedMessage(null);
    }
  };

  if (!currentUser) {
    return null; 
  }
  
  const visibleMessages = messages.filter(message => !message.deletedFor?.includes(currentUser.uid));

  return (
    <>
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="p-6 space-y-2">
          {visibleMessages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUser.uid;
            const showAvatar = index === 0 || visibleMessages[index - 1].senderId !== message.senderId;
            
            return (
              <div
                key={message.id || index}
                className={cn('flex items-end gap-3 group', isCurrentUser ? 'justify-end' : 'justify-start')}
              >
                {!isCurrentUser && (
                  <Avatar className={cn('h-8 w-8 self-end', showAvatar ? 'opacity-100' : 'opacity-0')}>
                     {showAvatar && <AvatarImage src={contactAvatar} alt="Contact Avatar" data-ai-hint="profile picture"/>}
                     {showAvatar && <AvatarFallback>C</AvatarFallback>}
                  </Avatar>
                )}
                 <div className="w-full flex flex-col" style={{ alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <div
                                className={cn(
                                    'max-w-[70%] rounded-xl shadow-sm break-words p-3 cursor-pointer',
                                    isCurrentUser
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-background text-foreground rounded-bl-none',
                                    message.isDeleted && 'bg-transparent shadow-none',
                                    message.type === 'image' && !message.text ? 'p-1' : '',
                                )}
                            >
                                <MessageContent message={message} isEncrypted={isEncrypted} />
                            </div>
                        </DropdownMenuTrigger>
                        {isCurrentUser && !message.isDeleted && (
                             <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                                <DropdownMenuItem onClick={() => handleDeleteRequest(message.id, 'me')} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete for me</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteRequest(message.id, 'everyone')} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete for everyone</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
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
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. 
              {selectedMessage?.type === 'everyone' && ' This will permanently delete this message for everyone.'}
              {selectedMessage?.type === 'me' && ' This will hide this message for you.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMessage(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

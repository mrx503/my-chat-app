

"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Check, CheckCheck, File, User, Users, CornerUpLeft } from 'lucide-react';
import { Button } from './ui/button';
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
import { motion, useMotionValue, useTransform } from 'framer-motion';
import ReplyContent from './reply-content';

interface MessageListProps {
  messages: Message[];
  contactAvatar: string;
  isEncrypted: boolean;
  onDeleteMessage: (messageId: string, type: 'me' | 'everyone') => void;
  onReplyToMessage: (message: Message) => void;
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
                <div className="relative w-60 h-48 rounded-md overflow-hidden">
                    <Image
                        src={message.fileURL}
                        alt={message.fileName || 'Sent image'}
                        layout="fill"
                        className="object-contain rounded-md"
                        data-ai-hint="sent image"
                    />
                </div>
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
                <audio controls src={message.fileURL} className="max-w-[250px]" />
            );
        default:
            return <p className="whitespace-pre-wrap break-words">{messageText}</p>;
    }
};

const MessageWrapper = ({ 
    message, 
    children, 
    onDeleteRequest, 
    onReplyRequest 
}: { 
    message: Message; 
    children: React.ReactNode; 
    onDeleteRequest: (type: 'me' | 'everyone') => void;
    onReplyRequest: () => void;
}) => {
    const { currentUser } = useAuth();
    const x = useMotionValue(0);

    const handleDragEnd = (event: any, info: any) => {
        if (info.offset.x < -50) { 
            x.set(-160); 
        } else {
            x.set(0); 
        }
    };
    
    if (message.senderId !== currentUser?.uid) {
        const [isHovered, setIsHovered] = useState(false);
        return (
            <div 
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {children}
                {isHovered && !message.isDeleted && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-full ml-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReplyRequest}>
                            <CornerUpLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        );
    }
    
    useEffect(() => {
        x.set(0);
    }, [message.id, x]);


    return (
        <div className="relative w-full overflow-hidden">
            <motion.div
                 className="absolute right-0 top-0 h-full flex items-center pr-4"
                 style={{ opacity: useTransform(x, [-160, 0], [1, 0]) }}
            >
                {!message.isDeleted && (
                  <div className="flex bg-muted p-2 rounded-lg gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReplyRequest}>
                          <CornerUpLeft className="h-5 w-5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteRequest('me')}>
                          <User className="h-5 w-5 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteRequest('everyone')}>
                          <Users className="h-5 w-5 text-destructive" />
                      </Button>
                  </div>
                )}
            </motion.div>
            <motion.div
                drag={message.isDeleted ? false : 'x'}
                dragConstraints={{ left: -160, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="relative z-10 bg-background"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default function MessageList({ messages, contactAvatar, isEncrypted, onDeleteMessage, onReplyToMessage }: MessageListProps) {
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

  const handleReplyRequest = (message: Message) => {
    onReplyToMessage(message);
  }

  if (!currentUser) {
    return null; 
  }
  
  const visibleMessages = messages.filter(message => !message.deletedFor?.includes(currentUser.uid));

  return (
    <>
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <div className="p-4 space-y-4">
          {visibleMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.uid;
            
            const messageBubble = (
                 <div
                    className={cn(
                        'flex items-end gap-3 w-fit max-w-xl group',
                        isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                >
                    <Avatar className="h-8 w-8 self-end">
                      <AvatarImage src={isCurrentUser ? currentUser.avatar : contactAvatar} alt="Avatar" data-ai-hint="profile picture" />
                      <AvatarFallback>{isCurrentUser ? currentUser.email?.[0].toUpperCase() : 'C'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col gap-1">
                        <div
                            className={cn(
                                'rounded-xl shadow-sm break-words p-3',
                                isCurrentUser
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-card text-card-foreground rounded-bl-none',
                                message.isDeleted && 'bg-transparent shadow-none p-0',
                                (message.type === 'image' || message.type === 'audio') && 'p-1 bg-transparent dark:bg-transparent shadow-none',
                            )}
                        >
                            {message.replyTo && <ReplyContent reply={message.replyTo} />}
                            <MessageContent message={message} isEncrypted={isEncrypted} />
                        </div>
                        <div className={cn("flex items-center text-xs text-muted-foreground", isCurrentUser ? "justify-end" : "justify-start")}>
                            <FormattedTime timestamp={message.timestamp} />
                            {isCurrentUser && <ReadReceipt status={message.status} />}
                        </div>
                    </div>
                </div>
            );
            
            return (
                 <MessageWrapper 
                    key={message.id} 
                    message={message} 
                    onDeleteRequest={(type) => handleDeleteRequest(message.id, type)}
                    onReplyRequest={() => handleReplyRequest(message)}
                 >
                    {messageBubble}
                 </MessageWrapper>
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

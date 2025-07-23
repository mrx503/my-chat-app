

"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Check, CheckCheck, File, User, Users, CornerUpLeft, Reply } from 'lucide-react';
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

    const isCurrentUser = message.senderId === currentUser?.uid;

    const handleDragEnd = (event: any, info: any) => {
        if (message.isDeleted) return;

        const dragThreshold = 50;
        if (isCurrentUser) { 
            if (info.offset.x < -dragThreshold) {
                onReplyRequest();
            }
        } else {
            if (info.offset.x > dragThreshold) {
                onReplyRequest();
            }
        }
        x.set(0);
    };
    
    useEffect(() => {
        x.set(0);
    }, [message.id, x]);
    
    const replyOpacity = useTransform(x, isCurrentUser ? [-50, 0] : [0, 50], [1, 0]);
    const deleteOpacity = useTransform(x, [-160, -50], [1, 0]);

    const dragProps = message.isDeleted ? {} : {
        drag: "x" as const,
        dragConstraints: isCurrentUser ? { left: -160, right: 0 } : { left: 0, right: 80 },
        onDragEnd: handleDragEnd,
        style: { x },
    };


    return (
        <div className="relative w-full overflow-hidden">
             {/* Action Icons Container */}
            <div className={cn("absolute inset-y-0 flex items-center", isCurrentUser ? "right-0" : "left-0")}>
                 {isCurrentUser && !message.isDeleted && (
                  <motion.div style={{ opacity: deleteOpacity }} className="flex bg-muted p-2 rounded-lg gap-2 mr-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteRequest('me')}>
                          <User className="h-5 w-5 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteRequest('everyone')}>
                          <Users className="h-5 w-5 text-destructive" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onReplyRequest}>
                          <Reply className="h-5 w-5 text-primary" />
                      </Button>
                  </motion.div>
                )}
                 {!isCurrentUser && !message.isDeleted && (
                     <motion.div style={{ opacity: replyOpacity }} className="flex items-center justify-center w-20">
                         <CornerUpLeft className="h-5 w-5 text-primary" />
                     </motion.div>
                 )}
            </div>
            
            <motion.div
                {...dragProps}
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

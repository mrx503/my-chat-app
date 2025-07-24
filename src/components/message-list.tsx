

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
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
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
                        className={cn("object-contain rounded-md", isEncrypted && "blur-md")}
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
                                <p className={cn("font-semibold break-all", isEncrypted && "blur-sm")}>{message.fileName}</p>
                                <p className="text-xs text-muted-foreground">Click to download</p>
                            </div>
                        </div>
                    </Button>
                </a>
            );
        case 'audio':
            if (!message.fileURL) return null;
            return (
                <audio controls src={message.fileURL} className={cn("max-w-[250px]", isEncrypted && "filter blur-sm")} />
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
    const [isRevealed, setIsRevealed] = useState(false);

    const isCurrentUser = message.senderId === currentUser?.uid;
    const dragThreshold = isCurrentUser ? -50 : 50;
    
    const getRevealPosition = () => {
        if (!isCurrentUser) return 80; // Only reply
        if (message.isDeleted) return 0;
        
        let position = -80; // start with reply
        if (!message.isDeleted) {
             position -= 80; // add space for delete buttons
        }
        return position;
    }

    const handleDragEnd = (event: any, info: any) => {
        const shouldReveal = isCurrentUser ? info.offset.x < dragThreshold : info.offset.x > dragThreshold;
        if (shouldReveal && !message.isDeleted) {
            setIsRevealed(true);
            x.set(getRevealPosition());
        } else {
            setIsRevealed(false);
            x.set(0);
        }
    };

    const handleAction = (action: () => void) => {
        action();
        setIsRevealed(false);
        x.set(0);
    };
    
    useEffect(() => {
        setIsRevealed(false);
        x.set(0);
    }, [message.id, x]);
    
    const dragProps = (message.isDeleted) ? {} : {
        drag: "x" as const,
        dragConstraints: { left: 0, right: 0 },
        onDragEnd: handleDragEnd,
        style: { x },
    };

    return (
        <div className="relative w-full overflow-hidden">
            <AnimatePresence>
                {isRevealed && !message.isDeleted && (
                    <motion.div 
                        className={cn("absolute inset-y-0 flex items-center", isCurrentUser ? "right-0" : "left-0")}
                        initial={{ opacity: 0}}
                        animate={{ opacity: 1}}
                        exit={{ opacity: 0 }}
                    >
                        {isCurrentUser ? (
                            <div className="flex bg-transparent p-2 rounded-lg gap-2 mr-4">
                                {!message.isDeleted && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-500/80 hover:bg-blue-500 text-white" onClick={() => handleAction(onReplyRequest)}>
                                            <Reply className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/80 hover:bg-red-500 text-white" onClick={() => handleAction(() => onDeleteRequest('me'))}>
                                            <User className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500/80 hover:bg-red-500 text-white" onClick={() => handleAction(() => onDeleteRequest('everyone'))}>
                                            <Users className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-20">
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-gray-500/80 hover:bg-gray-500 text-white" onClick={() => handleAction(onReplyRequest)}>
                                    <CornerUpLeft className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <motion.div
                {...dragProps}
                className="relative z-10 bg-transparent"
                animate={{x: isRevealed ? getRevealPosition(): 0}}
                transition={{type: 'spring', stiffness: 300, damping: 30}}
                onTap={() => {
                    if (isRevealed) {
                        setIsRevealed(false);
                        x.set(0);
                    }
                }}
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
                                    : 'bg-muted text-card-foreground rounded-bl-none',
                                message.isDeleted && 'bg-transparent shadow-none p-0',
                                (message.type === 'image' || message.type === 'audio') && 'p-1 bg-transparent dark:bg-transparent shadow-none',
                            )}
                        >
                            {message.replyTo && !isEncrypted && <ReplyContent reply={message.replyTo} isCurrentUserReply={isCurrentUser} />}
                            <MessageContent message={message} isEncrypted={isEncrypted} />
                        </div>
                        <div className={cn("flex items-center text-xs text-muted-foreground", isCurrentUser ? "justify-end" : "justify-start")}>
                            <FormattedTime timestamp={message.timestamp} />
                            {isCurrentUser && !message.isDeleted && <ReadReceipt status={message.status} />}
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

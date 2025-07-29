
"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Check, CheckCheck, File, Reply, PlayCircle, Trash2 } from 'lucide-react';
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
import ReplyContent from './reply-content';
import Lightbox from './lightbox';
import { motion, AnimatePresence } from 'framer-motion';


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

const MessageContent = ({ message, isEncrypted, onMediaClick }: { message: Message; isEncrypted: boolean, onMediaClick: (message: Message) => void; }) => {
    if (message.isDeleted) {
        return <p className="whitespace-pre-wrap break-words text-muted-foreground italic">This message was deleted</p>;
    }

    const messageText = message.text;

    const renderMedia = () => {
        switch (message.type) {
            case 'image':
                if (!message.fileURL) return null;
                return (
                    <button onClick={() => onMediaClick(message)} className="relative w-60 h-48 rounded-md overflow-hidden cursor-pointer block">
                         <Image
                            src={message.fileURL}
                            alt={message.fileName || 'Sent image'}
                            layout="fill"
                            className={cn("object-cover rounded-md", isEncrypted && "blur-md")}
                            data-ai-hint="sent image"
                        />
                    </button>
                );
            case 'video':
                 if (!message.fileURL) return null;
                return (
                    <button onClick={() => onMediaClick(message)} className="relative w-60 h-48 rounded-md overflow-hidden cursor-pointer block bg-black">
                        <video
                            src={message.fileURL}
                            className={cn("object-contain w-full h-full", isEncrypted && "blur-md")}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <PlayCircle className="h-12 w-12 text-white/80" />
                        </div>
                    </button>
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
                return null;
        }
    };
    
    const mediaElement = renderMedia();

    return (
        <div className="flex flex-col gap-1">
            {mediaElement}
            {messageText && (
                <p className={cn(
                    "whitespace-pre-wrap break-words",
                     mediaElement && messageText && 'px-3 pt-2 pb-1'
                )}>
                    {messageText}
                </p>
            )}
        </div>
    );
};


const MessageBubble = ({ message, isCurrentUser, contactAvatar, isEncrypted, onReply, onDeleteRequest, onMediaClick, activeMenuId, setActiveMenuId }: any) => {
    
    const isRevealed = activeMenuId === message.id;

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        const dragThreshold = isCurrentUser ? -50 : 50;
        const offset = info.offset.x;

        if ((isCurrentUser && offset < dragThreshold) || (!isCurrentUser && offset > dragThreshold)) {
            setActiveMenuId(message.id);
        } else {
            // This allows clicking outside to close
        }
    };
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setActiveMenuId(null);
    };

    const actionButtons = (
         <div className={cn("flex items-center", isCurrentUser ? "justify-end" : "justify-start")}>
            <div className="flex items-center bg-muted rounded-full shadow-md">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={(e) => handleActionClick(e, () => onReply(message))}>
                    <Reply className="h-5 w-5" />
                </Button>
                {isCurrentUser && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-destructive" onClick={(e) => handleActionClick(e, () => onDeleteRequest(message.id))}>
                        <Trash2 className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );

    const dragConstraints = isCurrentUser ? { left: -100, right: 0 } : { left: 0, right: 100 };
    const revealedX = isCurrentUser ? -90 : 90;

    return (
        <div className={cn('flex items-end gap-2 max-w-xl w-full', isCurrentUser ? 'self-end flex-row-reverse' : 'self-start')}>
             <Avatar className="h-8 w-8 self-end flex-shrink-0">
                <AvatarImage src={isCurrentUser ? (message.senderAvatar || '') : contactAvatar} alt="Avatar" data-ai-hint="profile picture" />
                <AvatarFallback>{isCurrentUser ? message.senderName?.[0].toUpperCase() : 'C'}</AvatarFallback>
            </Avatar>
            <div className="relative flex-1" onClick={() => isRevealed && setActiveMenuId(null)}>
                <motion.div
                    className={cn( "absolute inset-y-0 flex items-center w-24", isCurrentUser ? "right-full mr-2" : "left-full ml-2" )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isRevealed ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                   {actionButtons}
                </motion.div>
                <motion.div
                    drag="x"
                    dragConstraints={dragConstraints}
                    onDragEnd={handleDragEnd}
                    initial={{ x: 0 }}
                    animate={{ x: isRevealed ? revealedX : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="z-10 relative"
                >
                    <div
                        className={cn(
                            'rounded-xl shadow-sm break-words w-fit',
                            isCurrentUser
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted text-card-foreground mr-auto',
                            message.isDeleted && 'bg-transparent shadow-none p-0',
                            (message.type === 'image' || message.type === 'video') ? 'p-1 bg-transparent dark:bg-transparent shadow-none' : 'p-3'
                        )}
                    >
                        {message.replyTo && !isEncrypted && <ReplyContent reply={message.replyTo} isCurrentUserReply={isCurrentUser} />}
                        <MessageContent message={message} isEncrypted={isEncrypted} onMediaClick={onMediaClick} />
                    </div>
                     <div className={cn("flex items-center text-xs text-muted-foreground px-2 pb-1 mt-1", isCurrentUser ? "justify-end w-full" : "justify-start")}>
                        <FormattedTime timestamp={message.timestamp} />
                        {isCurrentUser && !message.isDeleted && <ReadReceipt status={message.status} />}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};


export default function MessageList({ messages, contactAvatar, isEncrypted, onDeleteMessage, onReplyToMessage }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [lightboxMessage, setLightboxMessage] = useState<Message | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isEncrypted]);

  const handleDeleteRequest = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = (type: 'me' | 'everyone') => {
    if (messageToDelete) {
      onDeleteMessage(messageToDelete, type);
    }
    setShowDeleteDialog(false);
    setMessageToDelete(null);
  };

  const handleMediaClick = (message: Message) => {
    if (!isEncrypted && (message.type === 'image' || message.type === 'video')) {
      setLightboxMessage(message);
    }
  };

  if (!currentUser) {
    return null; 
  }
  
  const visibleMessages = (messages || []).map(m => ({
    ...m,
    senderName: m.senderId === currentUser.uid ? 'You' : m.senderName,
    senderAvatar: currentUser.avatar
  }));


  return (
    <>
      <Lightbox 
        message={lightboxMessage}
        onClose={() => setLightboxMessage(null)}
      />
      <ScrollArea className="flex-1" viewportRef={viewportRef} onClick={() => activeMenuId && setActiveMenuId(null)}>
        <div className="p-4 space-y-4 flex flex-col">
          {visibleMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.uid;
            return (
                <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    contactAvatar={contactAvatar}
                    isEncrypted={isEncrypted}
                    onReply={onReplyToMessage}
                    onDeleteRequest={handleDeleteRequest}
                    onMediaClick={handleMediaClick}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                />
            );
          })}
        </div>
      </ScrollArea>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action may not be reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between gap-2">
            <Button variant="destructive" onClick={() => confirmDelete('everyone')}>
              Delete for Everyone
            </Button>
             <Button variant="outline" onClick={() => confirmDelete('me')}>
              Delete for Me
            </Button>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

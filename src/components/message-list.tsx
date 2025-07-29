
"use client"

import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Check, CheckCheck, File, Reply, PlayCircle, Trash2, Mic, Image as ImageIcon } from 'lucide-react';
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
import { motion, AnimatePresence, useAnimation } from 'framer-motion';


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


const MessageBubble = ({ message, isCurrentUser, contactAvatar, isEncrypted, onReplyToMessage, onDeleteMessage }: any) => {
    const controls = useAnimation();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        const dragThreshold = isCurrentUser ? -50 : 50;
        
        if ((isCurrentUser && info.offset.x < dragThreshold) || (!isCurrentUser && info.offset.x > dragThreshold)) {
            // Do nothing on drag, swipe is for reply
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleSwipeReply = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        const swipeThreshold = 50;
        if (Math.abs(info.offset.x) > swipeThreshold) {
            onReplyToMessage(message);
        }
        controls.start({ x: 0 }); // Snap back after swipe
    }

    const confirmDelete = (type: 'me' | 'everyone') => {
        if (messageIdToDelete) {
            onDeleteMessage(messageIdToDelete, type);
        }
        setShowDeleteDialog(false);
        setMessageIdToDelete(null);
    };

    const handleLongPress = () => {
        if (isCurrentUser) {
            setMessageIdToDelete(message.id);
            setShowDeleteDialog(true);
        }
    };

    return (
        <>
        <div className={cn('flex items-end gap-2 max-w-xl w-full relative', isCurrentUser ? 'self-end flex-row-reverse' : 'self-start')}>
             <Avatar className="h-8 w-8 self-end flex-shrink-0">
                <AvatarImage src={isCurrentUser ? (message.senderAvatar || '') : contactAvatar} alt="Avatar" data-ai-hint="profile picture" />
                <AvatarFallback>{isCurrentUser ? message.senderName?.[0].toUpperCase() : 'C'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden relative">
                <motion.div 
                    className={cn("absolute inset-y-0 flex items-center z-0", isCurrentUser ? "right-full pr-2" : "left-full pl-2")}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={controls}
                >
                    <Reply className="h-5 w-5 text-muted-foreground" />
                </motion.div>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDrag={(event, info) => {
                       const x = info.offset.x;
                       if ((isCurrentUser && x > 0) || (!isCurrentUser && x < 0)) {
                           //
                       } else {
                           controls.set({ x: x / 3, scale: 0.5 + Math.min(Math.abs(x) / 200, 0.5), opacity: Math.min(Math.abs(x) / 50, 1) });
                       }
                    }}
                    onDragEnd={handleSwipeReply}
                    className="z-10 relative"
                    onContextMenu={(e) => { e.preventDefault(); handleLongPress(); }}
                    onDoubleClick={handleLongPress}
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
                        <MessageContent message={message} isEncrypted={isEncrypted} onMediaClick={() => {}} />
                    </div>
                </motion.div>
            </div>
        </div>
        <div className={cn("flex items-center text-xs text-muted-foreground px-2 pb-1 mt-1 w-full", isCurrentUser ? "justify-end" : "justify-start pl-12")}>
            <FormattedTime timestamp={message.timestamp} />
            {isCurrentUser && !message.isDeleted && <ReadReceipt status={message.status} />}
        </div>
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
                    <Trash2 className="mr-2"/> Delete for Everyone
                </Button>
                <Button variant="outline" onClick={() => confirmDelete('me')}>
                    <Trash2 className="mr-2"/> Delete for Me
                </Button>
                <AlertDialogCancel onClick={() => setMessageIdToDelete(null)}>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};


export default function MessageList({ messages, contactAvatar, isEncrypted, onDeleteMessage, onReplyToMessage }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  const [lightboxMessage, setLightboxMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isEncrypted]);


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
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <AnimatePresence>
            <div className="p-4 space-y-1 flex flex-col">
              {visibleMessages.map((message) => {
                const isCurrentUser = message.senderId === currentUser.uid;
                return (
                    <motion.div
                        key={message.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                        className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start")}
                    >
                        <MessageBubble
                            message={message}
                            isCurrentUser={isCurrentUser}
                            contactAvatar={contactAvatar}
                            isEncrypted={isEncrypted}
                            onReplyToMessage={onReplyToMessage}
                            onDeleteMessage={onDeleteMessage}
                            onMediaClick={handleMediaClick}
                        />
                    </motion.div>
                );
              })}
            </div>
        </AnimatePresence>
      </ScrollArea>
    </>
  );
}

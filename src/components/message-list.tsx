
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
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';


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


const MessageBubble = ({ 
    message, 
    isCurrentUser, 
    contactAvatar, 
    isEncrypted, 
    onReplyToMessage, 
    onDeleteMessage,
    onMediaClick,
    revealedMessageId,
    setRevealedMessageId
}: {
    message: Message,
    isCurrentUser: boolean,
    contactAvatar: string,
    isEncrypted: boolean,
    onReplyToMessage: (message: Message) => void,
    onDeleteMessage: (messageId: string, type: 'me' | 'everyone') => void,
    onMediaClick: (message: Message) => void,
    revealedMessageId: string | null,
    setRevealedMessageId: (id: string | null) => void
}) => {
    const controls = useAnimation();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);

    const isRevealed = revealedMessageId === message.id;

    useEffect(() => {
        if (isRevealed) {
            const dragValue = isCurrentUser ? -140 : 140; // width of buttons
            controls.start({ x: dragValue });
        } else {
            controls.start({ x: 0 });
        }
    }, [isRevealed, controls, isCurrentUser]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
                if(isRevealed) {
                    setRevealedMessageId(null);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isRevealed, setRevealedMessageId]);


    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const dragThreshold = 50;
        const isSwipe = Math.abs(info.offset.x) > dragThreshold;

        if (isSwipe) {
            setRevealedMessageId(message.id);
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
        }
    };
    
    const confirmDelete = (type: 'me' | 'everyone') => {
        onDeleteMessage(message.id, type);
        setShowDeleteDialog(false);
        setRevealedMessageId(null);
    };

    return (
        <div ref={messageRef} className={cn('flex items-end gap-2 max-w-xl w-full relative', isCurrentUser ? 'self-end flex-row-reverse' : 'self-start')}>
             <Avatar className="h-8 w-8 self-end flex-shrink-0">
                <AvatarImage src={isCurrentUser ? (message.senderAvatar || '') : contactAvatar} alt="Avatar" data-ai-hint="profile picture" />
                <AvatarFallback>{isCurrentUser ? message.senderName?.[0].toUpperCase() : 'C'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden relative">
                
                 {/* Action Buttons Container */}
                 <div className={cn(
                    'absolute inset-y-0 flex items-center', 
                    isCurrentUser ? 'left-full' : 'right-full'
                )}>
                    <div className={cn(
                        'flex items-center bg-muted/80 rounded-lg p-1', 
                        isCurrentUser ? 'ml-2' : 'mr-2'
                    )}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onReplyToMessage(message)}>
                            <Reply className="h-4 w-4" />
                        </Button>
                        {isCurrentUser && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setShowDeleteDialog(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <motion.div
                    drag="x"
                    dragConstraints={isCurrentUser ? { left: -140, right: 0 } : { left: 0, right: 140 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    className="z-10 relative"
                    style={{ touchAction: 'pan-y' }}
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
                        onClickCapture={(e) => {
                            // Prevent click when revealing actions
                            if(isRevealed) {
                                e.stopPropagation();
                                setRevealedMessageId(null);
                            }
                        }}
                    >
                        {message.replyTo && !isEncrypted && <ReplyContent reply={message.replyTo} isCurrentUserReply={isCurrentUser} />}
                        <MessageContent message={message} isEncrypted={isEncrypted} onMediaClick={onMediaClick} />
                    </div>
                </motion.div>
            </div>
             <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                  </AlertDialogHeader>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  <AlertDialogFooter className="sm:justify-between gap-2">
                    <Button variant="destructive" onClick={() => confirmDelete('everyone')}>
                        <Trash2 className="mr-2"/> Delete for Everyone
                    </Button>
                    <Button variant="outline" onClick={() => confirmDelete('me')}>
                        Delete for Me
                    </Button>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};


export default function MessageList({ messages, contactAvatar, isEncrypted, onDeleteMessage, onReplyToMessage }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  const [lightboxMessage, setLightboxMessage] = useState<Message | null>(null);
  const [revealedMessageId, setRevealedMessageId] = useState<string | null>(null);


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
                         <div className="w-full flex flex-col">
                            <MessageBubble
                                message={message}
                                isCurrentUser={isCurrentUser}
                                contactAvatar={contactAvatar}
                                isEncrypted={isEncrypted}
                                onReplyToMessage={onReplyToMessage}
                                onDeleteMessage={onDeleteMessage}
                                onMediaClick={handleMediaClick}
                                revealedMessageId={revealedMessageId}
                                setRevealedMessageId={setRevealedMessageId}
                            />
                            <div className={cn("flex items-center text-xs text-muted-foreground px-2 pb-1 mt-1 w-full", isCurrentUser ? "justify-end" : "justify-start pl-12")}>
                                <FormattedTime timestamp={message.timestamp} />
                                {isCurrentUser && !message.isDeleted && <ReadReceipt status={message.status} />}
                            </div>
                        </div>
                    </motion.div>
                );
              })}
            </div>
        </AnimatePresence>
      </ScrollArea>
    </>
  );
}

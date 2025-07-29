
"use client";

import React from 'react';
import { X, File, Mic, Image as ImageIcon } from 'lucide-react';
import type { Message } from '@/lib/types';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ReplyPreviewProps {
  message: Message | null;
  onCancelReply: () => void;
}

export default function ReplyPreview({ message, onCancelReply }: ReplyPreviewProps) {
  const { currentUser } = useAuth();
  
  if (!message) return null;

  const getMessagePreview = () => {
    switch (message.type) {
        case 'image':
            return (
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{message.text || 'Image'}</span>
                </div>
            );
        case 'video':
            return (
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{message.text || 'Video'}</span>
                </div>
            );
        case 'file': 
            return (
                <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{message.fileName || 'File'}</span>
                </div>
            );
        case 'audio': 
            return (
                <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Voice message</span>
                </div>
            );
        default: 
            return <p className="text-sm text-muted-foreground truncate">{message.text}</p>;
    }
  }

  const senderName = message.senderId === currentUser?.uid ? 'yourself' : message.senderName || '...';

  return (
    <AnimatePresence>
        <motion.div 
            className="p-2 border-t bg-background/80 backdrop-blur-sm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                <div className={cn("border-l-4 border-primary pl-3 flex-1 overflow-hidden")}>
                    <p className="font-semibold text-primary text-sm">Replying to {senderName}</p>
                    {getMessagePreview()}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={onCancelReply}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cancel reply</span>
                </Button>
            </div>
        </motion.div>
    </AnimatePresence>
  );
}

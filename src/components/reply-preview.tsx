
"use client";

import React from 'react';
import { X } from 'lucide-react';
import type { Message } from '@/lib/types';
import { Button } from './ui/button';

interface ReplyPreviewProps {
  message: Message;
  onCancelReply: () => void;
}

export default function ReplyPreview({ message, onCancelReply }: ReplyPreviewProps) {
  const getMessageText = () => {
    switch (message.type) {
        case 'image': return 'Image';
        case 'file': return message.fileName || 'File';
        case 'audio': return 'Voice message';
        default: return message.text;
    }
  }

  return (
    <div className="p-2 border-t bg-background flex justify-between items-center">
      <div className="border-l-4 border-primary pl-3">
        <p className="font-semibold text-primary text-sm">Replying to {message.senderId === 'You' ? 'yourself' : message.senderId}</p>
        <p className="text-sm text-muted-foreground truncate">{getMessageText()}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onCancelReply}>
        <X className="h-5 w-5" />
        <span className="sr-only">Cancel reply</span>
      </Button>
    </div>
  );
}

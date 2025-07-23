
"use client";

import React from 'react';
import type { ReplyTo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { File, Image as ImageIcon, Mic } from 'lucide-react';

interface ReplyContentProps {
  reply: ReplyTo;
  className?: string;
}

export default function ReplyContent({ reply, className }: ReplyContentProps) {
  const getMessagePreview = () => {
    if (reply.messageText) {
      return reply.messageText;
    }
    // This part can be expanded if you store file types in the reply object
    // For now, it's text-focused.
    return '...'; 
  };

  return (
    <div className={cn("mb-2 p-2 rounded-md border-l-4 border-primary bg-primary/10", className)}>
      <p className="font-semibold text-primary text-sm">{reply.senderName}</p>
      <p className="text-sm text-muted-foreground truncate">{getMessagePreview()}</p>
    </div>
  );
}

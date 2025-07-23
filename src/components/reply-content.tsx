
"use client";

import React from 'react';
import type { ReplyTo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { File, Mic, Image as ImageIcon } from 'lucide-react';

interface ReplyContentProps {
  reply: ReplyTo;
  className?: string;
  isCurrentUserReply: boolean;
}

export default function ReplyContent({ reply, className, isCurrentUserReply }: ReplyContentProps) {
  
  const getMessagePreview = () => {
    switch (reply.type) {
        case 'image':
            return (
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Image</span>
                </div>
            )
        case 'file':
             return (
                <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="truncate">{reply.fileName || "File"}</span>
                </div>
            )
        case 'audio':
            return (
                <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span>Voice message</span>
                </div>
            )
        default:
            return reply.messageText;
    }
  };

  const replyBgColor = isCurrentUserReply 
    ? 'bg-primary/20' 
    : 'bg-black/10 dark:bg-white/10';

  const replyBorderColor = isCurrentUserReply
    ? 'border-primary-foreground/80'
    : 'border-primary';

  const replySenderColor = isCurrentUserReply
    ? 'text-primary-foreground/90 font-semibold'
    : 'text-primary font-semibold';

  return (
    <div className={cn(
      "mb-1.5 p-2 rounded-md border-l-4",
      replyBgColor,
      replyBorderColor,
      "backdrop-blur-sm",
      className
    )}>
      <p className={cn("font-semibold text-sm", replySenderColor)}>{reply.senderName}</p>
      <div className={cn(
        "text-sm truncate",
        isCurrentUserReply ? "text-primary-foreground/80" : "text-foreground/80"
      )}>
        {getMessagePreview()}
      </div>
    </div>
  );
}

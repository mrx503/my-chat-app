
"use client";

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LightboxProps {
  message: Message | null;
  onClose: () => void;
}

export default function Lightbox({ message, onClose }: LightboxProps) {
  if (!message || !message.fileURL) {
    return null;
  }
  
  const isImage = message.type === 'image';
  const isVideo = message.type === 'video';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isImage && (
              <img src={message.fileURL} alt={message.fileName || "Full-screen view"} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" onContextMenu={(e) => e.preventDefault()} />
            )}
            {isVideo && (
              <video src={message.fileURL} controls autoPlay className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" onContextMenu={(e) => e.preventDefault()} />
            )}
             <div className={cn("absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg text-center", !message.text && "hidden")}>
                {message.text}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


"use client";

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface LightboxProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  onClose: () => void;
}

export default function Lightbox({ imageUrl, videoUrl, onClose }: LightboxProps) {

  const mediaUrl = imageUrl || videoUrl;
  const isVideo = !!videoUrl;

  return (
    <AnimatePresence>
      {mediaUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {isVideo ? (
                <video src={mediaUrl} controls autoPlay className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
              ) : (
                <img src={mediaUrl} alt={"Full-screen view"} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" onContextMenu={(e) => e.preventDefault()} />
              )}
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

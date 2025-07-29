
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  fileSrc: string | null;
  onSend: (caption: string) => void;
}

export default function FilePreviewModal({ isOpen, onClose, file, fileSrc, onSend }: FilePreviewModalProps) {
  const [caption, setCaption] = useState('');

  if (!isOpen || !file || !fileSrc) {
    return null;
  }

  const handleSend = () => {
    onSend(caption);
    setCaption('');
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Send File</DialogTitle>
        </DialogHeader>
        <div className="flex-1 bg-black/80 flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={fileSrc} alt="Preview" className="max-h-full max-w-full object-contain" />
          ) : isVideo ? (
            <video src={fileSrc} controls className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="p-8 text-center bg-muted rounded-lg">
                <p className="font-bold">{file.name}</p>
                <p className="text-sm text-muted-foreground">Cannot preview this file type.</p>
            </div>
          )}
        </div>
        <DialogFooter className="p-4 bg-background border-t">
          <div className="flex w-full items-center gap-2">
            <Input
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                }
              }}
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

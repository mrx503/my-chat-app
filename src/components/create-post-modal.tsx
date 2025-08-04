
"use client"

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (content: string, mediaFile: File | null) => Promise<void>;
}

export default function CreatePostModal({ isOpen, onClose, user, onSubmit }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      if ((type === 'image' && !file.type.startsWith('image/')) || (type === 'video' && !file.type.startsWith('video/'))) {
        toast({ variant: 'destructive', title: 'Invalid File Type' });
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePostSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      toast({ variant: 'destructive', title: 'Cannot create an empty post' });
      return;
    }
    
    setIsSubmitting(true);
    await onSubmit(content, mediaFile);
    setIsSubmitting(false);
  };
  
  const resetState = () => {
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    setIsSubmitting(false);
  }

  const handleClose = () => {
    resetState();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={`What's on your mind, ${user.name}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] text-base"
              disabled={isSubmitting}
            />
          </div>

          {mediaPreview && (
            <div className="relative">
              {mediaFile?.type.startsWith('image/') ? (
                <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
              ) : (
                <video src={mediaPreview} controls className="rounded-lg max-h-80 w-full" />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex justify-between items-center p-2 border rounded-lg">
            <span className="text-sm font-medium">Add to your post</span>
            <div className="flex gap-1">
              <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
              <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isSubmitting}>
                <ImageIcon className="text-green-500" />
              </Button>
              <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" />
              <Button variant="ghost" size="icon" onClick={() => videoInputRef.current?.click()} disabled={isSubmitting}>
                <Video className="text-blue-500" />
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
            <Button onClick={handlePostSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

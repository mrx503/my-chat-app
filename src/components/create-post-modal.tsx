
"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (content: string, mediaFile: File | null) => Promise<void>;
  postToEdit?: Post | null;
}

export default function CreatePostModal({ isOpen, onClose, user, onSubmit, postToEdit }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isEditMode = !!postToEdit;

  useEffect(() => {
    if (isOpen && isEditMode) {
      setContent(postToEdit.content);
      // Editing doesn't allow changing the media for simplicity
      setMediaPreview(postToEdit.mediaUrl || null);
    } else if (!isOpen) {
        // Reset state when modal is closed
        resetState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postToEdit, isEditMode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type' });
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePostSubmit = async () => {
    if (!content.trim() && !mediaFile && !isEditMode) {
      toast({ variant: 'destructive', title: 'Cannot create an empty post' });
      return;
    }
    
    setIsSubmitting(true);
    await onSubmit(content, isEditMode ? null : mediaFile);
    // The parent component should close the modal on success.
    // If it fails, the modal remains open for the user to try again.
    setIsSubmitting(false);
  };
  
  const resetState = () => {
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
        resetState();
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Post' : 'Create Post'}</DialogTitle>
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

          {(mediaPreview) && (
            <div className="relative">
              {((mediaFile?.type.startsWith('image/')) || (isEditMode && postToEdit.mediaType === 'image')) ? (
                <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
              ) : (
                <video src={mediaPreview} controls className="rounded-lg max-h-80 w-full" />
              )}
              {!isEditMode && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
              )}
            </div>
          )}
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

          <div className="flex justify-between items-center p-2 border rounded-lg">
              <span className="text-sm font-medium">Add to your post</span>
              <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={triggerFileSelect} disabled={isSubmitting || !!mediaFile || isEditMode}>
                  <ImageIcon className="text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={triggerFileSelect} disabled={isSubmitting || !!mediaFile || isEditMode}>
                  <Video className="text-blue-500" />
              </Button>
              </div>
          </div>
        </div>
        
        <DialogFooter>
            <Button onClick={handlePostSubmit} disabled={isSubmitting || (!content.trim() && !mediaFile && !isEditMode)} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Posting...') : (isEditMode ? 'Save Changes' : 'Post')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
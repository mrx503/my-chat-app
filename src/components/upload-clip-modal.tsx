
"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

interface UploadClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (videoUrl: string, caption: string) => void;
}

export default function UploadClipModal({ isOpen, onClose, onUpload }: UploadClipModalProps) {
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('video/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select a valid video file.' });
            if (event.target) event.target.value = '';
            return;
        }
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select a video file smaller than 50MB.' });
            if (event.target) event.target.value = '';
            return;
        }
        setVideoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setVideoSrc(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  }

  const handleSend = async () => {
    if (!videoFile) {
        toast({ variant: 'destructive', title: 'No Video', description: 'Please select a video to upload.' });
        return;
    }
    
    setIsUploading(true);
    toast({ title: 'Uploading video...', description: 'Please wait, this may take a moment.' });

    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('upload_preset', 'duck-chat');

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(data.error?.message || 'Upload failed');
        }
      
        onUpload(data.secure_url, caption);
        resetState();
        onClose();

    } catch (error: any) {
        console.error('Error uploading to Cloudinary:', error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message || 'Could not upload the video.' });
    } finally {
        setIsUploading(false);
    }
  };
  
  const resetState = () => {
    setCaption('');
    setVideoFile(null);
    setVideoSrc(null);
    setIsUploading(false);
  }

  const handleClose = () => {
    if (!isUploading) {
        resetState();
        onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload a New Clip</DialogTitle>
          <DialogDescription>
            Share a video with the community. Your clip will be visible to everyone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            {videoSrc ? (
                 <div className="space-y-2 relative">
                    <video src={videoSrc} controls className="w-full rounded-md max-h-[400px] bg-black" />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
                        onClick={() => {
                            setVideoFile(null);
                            setVideoSrc(null);
                        }}
                        disabled={isUploading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button variant="outline" className="w-full h-32" onClick={triggerFileSelect} disabled={isUploading}>
                    <div className="flex flex-col items-center justify-center gap-2">
                         <Video className="h-10 w-10 text-primary" />
                         <span className="font-semibold">Select Video</span>
                         <span className="text-sm text-muted-foreground">Tap to choose a video from your device</span>
                    </div>
                </Button>
            )}
           
            <Textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                disabled={!videoFile || isUploading}
            />
        </div>
        
        <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleSend} disabled={isUploading || !videoFile}>
                {isUploading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isUploading ? 'Uploading...' : 'Upload Clip'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

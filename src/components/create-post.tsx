
"use client"

import React, { useState, useRef } from 'react';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Image as ImageIcon, Video, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

interface CreatePostProps {
  user: User;
}

export default function CreatePost({ user }: CreatePostProps) {
  const [postContent, setPostContent] = useState('');
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
    if (!postContent.trim() && !mediaFile) {
        toast({ variant: 'destructive', title: 'Cannot create an empty post' });
        return;
    }
    
    setIsSubmitting(true);
    toast({ title: 'Creating post... (Feature in development)' });

    // In a real implementation:
    // 1. Upload mediaFile to storage (like Cloudinary or Firebase Storage)
    // 2. Get the URL of the uploaded media.
    // 3. Create a new document in the 'posts' collection in Firestore
    //    with postContent, mediaUrl, mediaType, userId, timestamp, etc.
    
    setTimeout(() => {
        // Reset state after "submission"
        setPostContent('');
        setMediaFile(null);
        setMediaPreview(null);
        setIsSubmitting(false);
        toast({ title: 'Post created successfully! (Simulated)' });
    }, 1500);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="hidden sm:block">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="w-full space-y-3">
            <Textarea
              placeholder={`What's on your mind, ${user.name}?`}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] text-base"
            />
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
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} accept="image/*" className="hidden" />
                <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon className="text-green-500" />
                </Button>
                <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'video')} accept="video/*" className="hidden" />
                <Button variant="ghost" size="icon" onClick={() => videoInputRef.current?.click()}>
                  <Video className="text-blue-500" />
                </Button>
              </div>
              <Button onClick={handlePostSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

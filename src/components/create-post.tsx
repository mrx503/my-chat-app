
"use client"

import React, { useState } from 'react';
import type { Post, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import CreatePostModal from './create-post-modal';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface CreatePostProps {
  user: User & { uid: string };
  onPostCreated: () => void; // Simplified to just trigger a re-fetch or rely on snapshot
  postToEdit?: Post | null;
  onEditComplete?: () => void;
}

const CLOUDINARY_CLOUD_NAME = 'dqgchsg6k';

export default function CreatePost({ user, onPostCreated, postToEdit, onEditComplete }: CreatePostProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handlePostSubmit = async (content: string, mediaFile: File | null) => {
    toast({ title: 'Creating post...' });
    
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (mediaFile) {
        try {
            const formData = new FormData();
            formData.append('file', mediaFile);
            formData.append('upload_preset', 'duck-chat');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error?.message || 'Upload failed');
            }
            mediaUrl = data.secure_url;
            mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        } catch (error) {
            console.error("Error uploading media:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your media file.' });
            return;
        }
    }
    
    try {
        const postData = {
            content,
            uploaderId: user.uid,
            timestamp: serverTimestamp(),
            likes: [],
            commentsCount: 0,
            ...(mediaUrl && { mediaUrl, mediaType }),
        };

        await addDoc(collection(db, "posts"), postData);
        
        onPostCreated();
        toast({ title: 'Post created successfully!' });
        setIsModalOpen(false);

    } catch (error) {
        console.error("Error creating post:", error);
        toast({ variant: 'destructive', title: 'Post Failed', description: 'Could not create your post.' });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 text-left px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
            >
              What's on your mind, {user.name}?
            </button>
          </div>
        </CardContent>
      </Card>
      
      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSubmit={handlePostSubmit}
      />
    </>
  );
}

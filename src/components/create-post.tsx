
"use client"

import React, { useState } from 'react';
import type { Post, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import CreatePostModal from './create-post-modal';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface CreatePostProps {
  user: User & { uid: string };
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ user, onPostCreated }: CreatePostProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handlePostSubmit = async (content: string, mediaFile: File | null) => {
    toast({ title: 'Creating post...' });
    
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (mediaFile) {
        try {
            const storage = getStorage();
            const mediaRef = ref(storage, `posts/${user.uid}/${Date.now()}_${mediaFile.name}`);
            const snapshot = await uploadBytes(mediaRef, mediaFile);
            mediaUrl = await getDownloadURL(snapshot.ref);
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

        const docRef = await addDoc(collection(db, "posts"), postData);
        
        const newPostForUI: Post = {
            id: docRef.id,
            ...postData,
            timestamp: new Date() as any, // Temporary timestamp for UI
            uploaderName: user.name,
            uploaderAvatar: user.avatar,
        };

        onPostCreated(newPostForUI);
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

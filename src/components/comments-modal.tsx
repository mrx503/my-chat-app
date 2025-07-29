
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Comment as CommentType, User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clipId: string;
  currentUser: User;
  onCommentsUpdate: (clipId: string, newCount: number) => void;
}

export default function CommentsModal({ isOpen, onClose, clipId, currentUser, onCommentsUpdate }: CommentsModalProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !clipId) return;

    setIsLoading(true);
    const commentsRef = collection(db, 'clips', clipId, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentType));
      setComments(commentsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load comments.' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, clipId, toast]);

  const handlePostComment = async () => {
    if (!newComment.trim() || isPosting) return;

    setIsPosting(true);
    const commentData = {
      text: newComment,
      userId: currentUser.uid,
      userName: currentUser.name || currentUser.email,
      userAvatar: currentUser.avatar,
      timestamp: serverTimestamp(),
    };

    try {
        const clipRef = doc(db, 'clips', clipId);
        const commentsRef = collection(db, 'clips', clipId, 'comments');

        await runTransaction(db, async (transaction) => {
            const clipDoc = await transaction.get(clipRef);
            if (!clipDoc.exists()) {
                throw "Clip does not exist.";
            }
            
            // Add the new comment
            transaction.set(doc(commentsRef), commentData);

            // Increment the commentsCount on the clip
            const newCount = (clipDoc.data().commentsCount || 0) + 1;
            transaction.update(clipRef, { commentsCount: newCount });
        });
        
        // Optimistically update the parent component
        onCommentsUpdate(clipId, comments.length + 1);
        setNewComment('');

    } catch (error) {
        console.error("Error posting comment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not post your comment.' });
    } finally {
        setIsPosting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
             <ScrollArea className="h-full">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length > 0 ? (
                    <div className="p-4 space-y-4">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={comment.userAvatar} />
                                    <AvatarFallback>{comment.userName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p>
                                        <span className="font-semibold text-sm">{comment.userName}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {comment.timestamp && formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true })}
                                        </span>
                                    </p>
                                    <p className="text-sm text-foreground">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-2" />
                        <p className="font-semibold">No comments yet</p>
                        <p className="text-sm">Be the first to comment!</p>
                    </div>
                )}
            </ScrollArea>
        </div>
        <div className="p-4 border-t bg-background">
          <div className="flex w-full items-center gap-2">
            <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
            </Avatar>
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isPosting}
            />
            <Button onClick={handlePostComment} size="icon" disabled={isPosting || !newComment.trim()}>
                {isPosting ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


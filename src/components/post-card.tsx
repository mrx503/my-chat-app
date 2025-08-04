
"use client";

import type { Post, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PostCardProps {
  post: Post;
  currentUser: User & { uid: string };
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (post: Post) => void;
}

export default function PostCard({ post, currentUser, onLike, onDelete, onComment }: PostCardProps) {
  const isOwnPost = post.uploaderId === currentUser.uid;
  const isLiked = post.likes.includes(currentUser.uid);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Avatar>
          <AvatarImage src={post.uploaderAvatar} alt={post.uploaderName} />
          <AvatarFallback>{post.uploaderName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.uploaderName}</p>
          <p className="text-xs text-muted-foreground">
            {post.timestamp && formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true })}
          </p>
        </div>
        {isOwnPost && (
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.mediaUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border">
            {post.mediaType === 'image' ? (
              <Image 
                src={post.mediaUrl} 
                alt="Post media" 
                width={500}
                height={500}
                className="w-full h-auto object-cover"
                data-ai-hint="post image"
              />
            ) : (
              <video src={post.mediaUrl} controls className="w-full bg-black" />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between p-2 border-t">
        <Button variant="ghost" className="flex-1" onClick={() => onLike(post.id)}>
          <Heart className={cn("mr-2 h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
          <span>{post.likes.length} Like</span>
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => onComment(post)}>
          <MessageCircle className="mr-2 h-5 w-5" />
          <span>{post.commentsCount} Comment</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

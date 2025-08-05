
"use client";

import type { Post, User } from '@/lib/types';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageCircle, MoreHorizontal, Flag, Gift, Trash2, Edit, ShieldCheck } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import CreatePostModal from './create-post-modal';
import { isAdmin } from '@/lib/admin';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
  currentUser: (User & { uid: string }) | null;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (post: Post) => void;
  onSupport: (post: Post) => void;
  onReport: (post: Post) => void;
  onEdit: (postId: string, newContent: string) => void;
}

export default function PostCard({ post, currentUser, onLike, onDelete, onComment, onSupport, onReport, onEdit }: PostCardProps) {
  const isOwnPost = post.uploaderId === currentUser?.uid;
  const isUserAdmin = currentUser ? isAdmin(currentUser.uid) : false;
  const isLiked = currentUser ? post.likes.includes(currentUser.uid) : false;
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        <Link href={`/profile/${post.uploaderId}`} className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.uploaderAvatar} alt={post.uploaderName} />
              <AvatarFallback>{post.uploaderName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold flex items-center gap-1.5 hover:underline">
                {post.uploaderName}
                {post.isUploaderVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {post.timestamp && formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true })}
              </p>
            </div>
        </Link>
        
        {currentUser && (
          <div className="ml-auto">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      {(isOwnPost || isUserAdmin) && (
                          <>
                              {isOwnPost && (
                                  <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Edit Post</span>
                                  </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete Post</span>
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>This action cannot be undone. This will permanently delete this post.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                              <DropdownMenuSeparator />
                          </>
                      )}
                      {!isOwnPost && (
                          <DropdownMenuItem onSelect={() => onReport(post)}>
                              <Flag className="mr-2 h-4 w-4" />
                              <span>Report Post</span>
                          </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
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

      <CardFooter className="flex justify-around items-center p-1 border-t">
          <Button variant="ghost" className="flex-1 text-xs sm:text-sm" onClick={() => onLike(post.id)}>
              <Heart className={cn("mr-2 h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
              <span>{post.likes.length} Like</span>
          </Button>
          <Button variant="ghost" className="flex-1 text-xs sm:text-sm" onClick={() => onComment(post)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              <span>{post.commentsCount} Comment</span>
          </Button>
          {!isOwnPost && (
              <Button variant="ghost" className="flex-1 text-xs sm:text-sm" onClick={() => onSupport(post)}>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>Support</span>
              </Button>
          )}
      </CardFooter>
    </Card>

    {isEditing && currentUser && (
        <CreatePostModal 
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            user={currentUser}
            postToEdit={post}
            onSubmit={async (content) => {
                await onEdit(post.id, content);
                setIsEditing(false);
            }}
        />
    )}
    </>
  );
}

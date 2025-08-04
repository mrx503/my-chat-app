
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/app-header';
import Sidebar from '@/components/sidebar';
import { cn } from '@/lib/utils';
import CreatePost from '@/components/create-post';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import PostCard from '@/components/post-card';
import CommentsModal from '@/components/comments-modal';

export default function Home() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const postsDataPromises = snapshot.docs.map(async (docSnapshot) => {
            const postData = { id: docSnapshot.id, ...docSnapshot.data() } as Post;
            
            const userDoc = await getDoc(doc(db, 'users', postData.uploaderId));
            if (userDoc.exists()) {
                postData.uploaderName = userDoc.data().name || 'Unknown';
                postData.uploaderAvatar = userDoc.data().avatar || '';
            } else {
                postData.uploaderName = 'Unknown User';
                postData.uploaderAvatar = '';
            }
            return postData;
        });

        const newPosts = await Promise.all(postsDataPromises);
        setPosts(newPosts);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(currentUser.uid);
    
    // Optimistic update
    setPosts(posts.map(p => p.id === postId ? {
      ...p,
      likes: isLiked ? p.likes.filter(uid => uid !== currentUser.uid) : [...p.likes, currentUser.uid]
    } : p));

    try {
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
      }
    } catch (error) {
      // Revert on error
      setPosts(posts.map(p => p.id === postId ? post : p));
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
        console.error("Error deleting post:", error);
    }
  };

  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  };
  
  const handleCommentsUpdate = (postId: string, newCount: number) => {
    setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
            return { ...post, commentsCount: newCount };
        }
        return post;
    }));
  };

  if (loading || !currentUser) {
    return (
        <div className="flex justify-center items-center h-screen bg-background">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading your session...</p>
            </div>
        </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-muted/40 overflow-hidden">
          <Sidebar 
              currentUser={currentUser}
              updateCurrentUser={updateCurrentUser}
              logout={logout}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
          />
          <div className={cn("flex flex-col flex-1 transition-all duration-300", isSidebarOpen ? "md:ml-72" : "ml-0")}>
              <AppHeader 
                  systemUnreadCount={0} // Placeholder
                  onSystemChatSelect={() => router.push('/chats')}
                  notifications={[]} // Placeholder
                  unreadNotificationsCount={0} // Placeholder
                  onMarkNotificationsRead={() => {}} // Placeholder
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />

              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6">
                    <CreatePost user={currentUser} onPostCreated={(newPost) => setPosts(prev => [newPost, ...prev])}/>
                    
                    {posts.length > 0 ? (
                      posts.map(post => (
                        <PostCard 
                          key={post.id} 
                          post={post} 
                          currentUser={currentUser}
                          onLike={handleLikePost}
                          onDelete={handleDeletePost}
                          onComment={handleOpenComments}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6">
                          <p className="text-muted-foreground font-semibold">No posts yet.</p>
                          <p className="text-sm text-muted-foreground">Be the first one to share something!</p>
                      </div>
                    )}
                  </div>
              </main>
          </div>
      </div>
      
       {selectedPost && currentUser && (
          <CommentsModal 
              isOpen={isCommentsModalOpen}
              onClose={() => setIsCommentsModalOpen(false)}
              clipId={selectedPost.id}
              clipUploaderId={selectedPost.uploaderId}
              currentUser={currentUser}
              onCommentsUpdate={handleCommentsUpdate}
              isPost={true}
          />
      )}
    </>
  );
}

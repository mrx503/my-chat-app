
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import AppHeader from '@/components/app-header';
import Sidebar from '@/components/sidebar';
import { cn } from '@/lib/utils';
import CreatePost from '@/components/create-post';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc, addDoc, serverTimestamp, where, getDocs, setDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post, Report, User, AppNotification, Chat } from '@/lib/types';
import PostCard from '@/components/post-card';
import CommentsModal from '@/components/comments-modal';
import SupportModal from '@/components/support-modal';
import ReportClipModal from '@/components/report-clip-modal';
import { useToast } from '@/hooks/use-toast';
import { isAdmin } from '@/lib/admin';

const SYSTEM_BOT_UID = 'system-bot-uid';

export default function Home() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // --- State moved from chats/page.tsx ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [systemChat, setSystemChat] = useState<Chat | null>(null);
  const [systemUnreadCount, setSystemUnreadCount] = useState(0);
  const processedMessagesRef = useRef<string[]>([]);


  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;

    // --- Post subscription ---
    const qPosts = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribePosts = onSnapshot(qPosts, async (snapshot) => {
        const postsDataPromises = snapshot.docs.map(async (docSnapshot) => {
            const postData = { id: docSnapshot.id, ...docSnapshot.data() } as Post;
            
            const userDoc = await getDoc(doc(db, 'users', postData.uploaderId));
            if (userDoc.exists()) {
                const uploaderData = userDoc.data();
                postData.uploaderName = uploaderData.name || 'Unknown';
                postData.uploaderAvatar = uploaderData.avatar || '';
                postData.isUploaderVerified = uploaderData.isVerified || false;
            } else {
                postData.uploaderName = 'Unknown User';
                postData.uploaderAvatar = '';
                postData.isUploaderVerified = false;
            }
            return postData;
        });
        const newPosts = await Promise.all(postsDataPromises);
        setPosts(newPosts);
    });

    // --- Notification subscription (moved from chats) ---
    const unsubscribeNotifications = onSnapshot(
        query(collection(db, 'notifications'), where('recipientId', '==', currentUser.uid)),
        (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            notifs.sort((a, b) => (b.timestamp?.toMillis() ?? 0) - (a.timestamp?.toMillis() ?? 0));
            setNotifications(notifs);
            setUnreadNotificationsCount(notifs.filter(n => !n.read).length);
        }
    );
    
    // --- System Chat subscription (moved from chats) ---
    const systemChatQuery = query(
        collection(db, 'chats'), 
        where('users', 'array-contains', currentUser.uid)
    );
    const unsubscribeSystemChat = onSnapshot(systemChatQuery, (snapshot) => {
        let foundSystemChat = false;
        snapshot.forEach((doc) => {
            if (doc.data().users.includes(SYSTEM_BOT_UID)) {
                const chatData = { id: doc.id, ...doc.data() } as Chat;
                setSystemChat(chatData);
                setSystemUnreadCount(chatData.unreadCount?.[currentUser.uid] ?? 0);
                foundSystemChat = true;
            }
        });
        if (!foundSystemChat) {
            setSystemChat(null);
            setSystemUnreadCount(0);
        }
    });


    return () => {
        unsubscribePosts();
        unsubscribeNotifications();
        unsubscribeSystemChat();
    }
  }, [currentUser]);
  
  // --- System Message Queue delivery logic (moved from chats) ---
  useEffect(() => {
      const deliverQueuedMessages = async () => {
          if (!currentUser || !currentUser.systemMessagesQueue || currentUser.systemMessagesQueue.length === 0) {
              return;
          }

          const messagesToProcess = currentUser.systemMessagesQueue.filter(
              msg => !processedMessagesRef.current.includes(msg)
          );

          if (messagesToProcess.length === 0) {
              return;
          }

          processedMessagesRef.current = [...processedMessagesRef.current, ...messagesToProcess];

          try {
              let chatRef;
              if (systemChat) {
                  chatRef = doc(db, 'chats', systemChat.id);
              } else {
                  chatRef = doc(collection(db, 'chats'));
                  const now = serverTimestamp();
                  await setDoc(chatRef, {
                      users: [currentUser.uid, SYSTEM_BOT_UID].sort(),
                      createdAt: now,
                      encrypted: false,
                      deletedFor: [],
                      lastMessageTimestamp: now,
                      lastMessageText: "Welcome!",
                      unreadCount: { [currentUser.uid]: 1 }
                  });
              }
              
              const messagesColRef = collection(chatRef, 'messages');
              for (const messageText of messagesToProcess) {
                  const newMessage = {
                      senderId: SYSTEM_BOT_UID,
                      text: messageText,
                      timestamp: serverTimestamp(),
                      type: 'text',
                      status: 'sent'
                  };
                  await addDoc(messagesColRef, newMessage);
                  
                  await updateDoc(chatRef, {
                      lastMessageText: messageText,
                      lastMessageTimestamp: newMessage.timestamp,
                      lastMessageSenderId: SYSTEM_BOT_UID,
                      [`unreadCount.${currentUser.uid}`]: increment(1)
                  });
              }
              
              const userDocRef = doc(db, 'users', currentUser.uid);
              await updateDoc(userDocRef, { systemMessagesQueue: [] });
              
              toast({
                  title: 'You have new system messages!',
                  description: 'Check your system messages for details.',
              });

          } catch (error) {
              console.error("Error delivering queued messages:", error);
              processedMessagesRef.current = processedMessagesRef.current.filter(
                  pMsg => !messagesToProcess.includes(pMsg)
              );
          }
      };

      deliverQueuedMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, systemChat]);


  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likes.includes(currentUser.uid);
    
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
      setPosts(posts.map(p => p.id === postId ? post : p));
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, "posts", postId));
        toast({ title: "Post Deleted", description: "The post has been permanently removed."});
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the post.'});
    }
  };
  
   const handleEditPost = async (postId: string, newContent: string) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { content: newContent });
        toast({ title: 'Post Updated', description: 'Your post has been successfully updated.'});
    } catch (error) {
        console.error("Error updating post:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update your post.' });
    }
  };


  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  };
  
  const handleOpenSupport = (post: Post) => {
    if (!currentUser || post.uploaderId === currentUser.uid) {
        toast({ variant: "destructive", title: "Action not allowed", description: "You cannot support your own post." });
        return;
    }
    setSelectedPost(post);
    setIsSupportModalOpen(true);
  };
  
  const handleOpenReport = (post: Post) => {
    if (!currentUser || post.uploaderId === currentUser.uid) return;
    setSelectedPost(post);
    setIsReportModalOpen(true);
  }

  const handleReportSubmit = async (reason: string, customReason?: string) => {
        if (!selectedPost || !currentUser) return;

        try {
            const reportData: Partial<Report> = {
                resourceId: selectedPost.id,
                resourceType: 'post',
                resourceUrl: selectedPost.mediaUrl || `post/${selectedPost.id}`,
                reporterId: currentUser.uid,
                reporterEmail: currentUser.email,
                reportedUserId: selectedPost.uploaderId,
                reportedUserEmail: selectedPost.uploaderName, 
                reason,
                customReason: customReason || '',
                status: 'pending',
                timestamp: serverTimestamp() as any,
            };
            await addDoc(collection(db, 'reports'), reportData);
            toast({ title: 'Report Submitted', description: 'Thank you. We will review the content shortly.' });
            setIsReportModalOpen(false);
            setSelectedPost(null);

        } catch (error) {
             console.error("Error submitting report:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your report.' });
        }
    };
  
  const handleCommentsUpdate = (postId: string, newCount: number) => {
    setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
            return { ...post, commentsCount: newCount };
        }
        return post;
    }));
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!currentUser || unreadNotificationsCount === 0) return;
    const batch = writeBatch(db);
    const notificationsToUpdate = notifications.filter(n => !n.read);
    notificationsToUpdate.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { read: true });
    });
    await batch.commit();
  }
  
  const handleSystemChatSelect = () => {
    if (systemChat) {
        router.push(`/chat/${systemChat.id}`);
    } else {
        toast({ title: 'No System Messages Yet' });
    }
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
                  systemUnreadCount={systemUnreadCount}
                  onSystemChatSelect={handleSystemChatSelect}
                  notifications={notifications}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onMarkNotificationsRead={handleMarkNotificationsAsRead}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />

              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6">
                    <CreatePost user={currentUser} onPostCreated={() => {}}/>
                    
                    {posts.length > 0 ? (
                      posts.map(post => (
                        <PostCard 
                          key={post.id} 
                          post={post} 
                          currentUser={currentUser}
                          onLike={handleLikePost}
                          onDelete={handleDeletePost}
                          onComment={handleOpenComments}
                          onSupport={handleOpenSupport}
                          onReport={handleOpenReport}
                          onEdit={handleEditPost}
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

      {selectedPost && currentUser && (
        <SupportModal
            isOpen={isSupportModalOpen}
            onClose={() => setIsSupportModalOpen(false)}
            recipient={selectedPost}
            sender={currentUser}
            onTransactionComplete={(newBalance) => updateCurrentUser({ coins: newBalance })}
            isPost={true}
        />
      )}

      {selectedPost && currentUser && (
        <ReportClipModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onSubmit={handleReportSubmit}
        />
      )}
    </>
  );
}

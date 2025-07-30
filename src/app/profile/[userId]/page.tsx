
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, orderBy, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Clip, Chat, AppNotification } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Video, Loader2, Play, UserPlus, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser, updateCurrentUser } = useAuth();
    const { toast } = useToast();

    const userId = params.userId as string;

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userClips, setUserClips] = useState<Clip[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    
    useEffect(() => {
        if (!userId) return;

        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', userId);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    toast({ variant: 'destructive', title: 'User not found' });
                    router.push('/');
                    return;
                }
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setProfileUser(userData);

                if (currentUser) {
                    setIsFollowing(currentUser.following?.includes(userId) ?? false);
                }

                const clipsRef = collection(db, 'clips');
                const q = query(clipsRef, where('uploaderId', '==', userId), orderBy('timestamp', 'desc'));
                const clipsSnapshot = await getDocs(q);
                const clipsData = clipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Clip));
                setUserClips(clipsData);

            } catch (error) {
                console.error("Error fetching user profile:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load user profile.' });
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, router, toast, currentUser]);
    
    const createNotification = async (type: 'follow' | 'like' | 'comment' | 'message', resourceId: string) => {
        if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) return;

        const notifRef = collection(db, 'notifications');
        const newNotification: AppNotification = {
            recipientId: profileUser.uid,
            senderId: currentUser.uid,
            senderName: currentUser.name || currentUser.email!,
            senderAvatar: currentUser.avatar,
            type: type,
            resourceId: resourceId,
            read: false,
            timestamp: serverTimestamp() as any
        };
        await addDoc(notifRef, newNotification);
    };

    const handleFollow = async () => {
        if (!currentUser || !profileUser || isFollowLoading) return;

        setIsFollowLoading(true);
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const profileUserRef = doc(db, 'users', profileUser.id);
        
        try {
            await runTransaction(db, async (transaction) => {
                const iAmFollowing = (await transaction.get(currentUserRef)).data()?.following?.includes(profileUser.id) ?? false;
                
                if (iAmFollowing) {
                    // Unfollow
                    transaction.update(currentUserRef, { following: arrayRemove(profileUser.id) });
                    transaction.update(profileUserRef, { followers: arrayRemove(currentUser.uid) });
                } else {
                    // Follow
                    transaction.update(currentUserRef, { following: arrayUnion(profileUser.id) });
                    transaction.update(profileUserRef, { followers: arrayUnion(currentUser.uid) });
                }
            });

            // After transaction succeeds, create notification
             if (!isFollowing) {
                await createNotification('follow', profileUser.id);
            }

            // UI updates
            setIsFollowing(!isFollowing);
            setProfileUser(prev => prev ? ({
                ...prev,
                followers: isFollowing 
                    ? prev.followers?.filter(id => id !== currentUser.uid)
                    : [...(prev.followers || []), currentUser.uid]
            }) : null);

            updateCurrentUser({
                following: isFollowing
                    ? currentUser.following?.filter(id => id !== profileUser.id)
                    : [...(currentUser.following || []), profileUser.id]
            });

            toast({
                title: isFollowing ? 'Unfollowed' : 'Followed!',
                description: `You are now ${isFollowing ? 'unfollowing' : 'following'} ${profileUser?.name}.`,
            });
        } catch (error) {
            console.error("Follow/unfollow error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An error occurred. Please try again.' });
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleStartChat = async () => {
        if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) return;
        setIsChatting(true);
        try {
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, 
                where('users', 'array-contains', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            let existingChat: Chat | null = null;
            
            querySnapshot.forEach(doc => {
                const chat = doc.data() as Chat;
                if (chat.users.includes(profileUser.uid)) {
                    existingChat = { id: doc.id, ...chat } as any;
                }
            });

            if (existingChat) {
                router.push(`/chat/${existingChat.id}`);
            } else {
                const now = serverTimestamp();
                const newChatRef = await addDoc(collection(db, 'chats'), {
                    users: [currentUser.uid, profileUser.uid].sort(),
                    createdAt: now,
                    encrypted: false,
                    deletedFor: [],
                    lastMessageTimestamp: now,
                    lastMessageText: 'Say hi!',
                    unreadCount: { [currentUser.uid]: 0, [profileUser.uid]: 1 }
                });
                router.push(`/chat/${newChatRef.id}`);
            }

        } catch (error) {
            console.error("Error starting chat:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start a chat.' });
        } finally {
            setIsChatting(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background p-4 text-center">
                <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
                <p className="text-muted-foreground mb-4">The profile you are looking for does not exist.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }
    
    return (
        <div className="bg-background min-h-screen">
            <header className="flex items-center p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold ml-4">{profileUser.name}</h1>
            </header>

            <main className="p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
                        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 text-4xl border-4 border-primary/20">
                            <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                            <AvatarFallback>{profileUser.name?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold">{profileUser.name}</h2>
                            <p className="text-muted-foreground">@{profileUser.email?.split('@')[0]}</p>
                            
                            <div className="flex gap-4 justify-center sm:justify-start mt-2">
                                <div><span className="font-bold">{userClips.length}</span> Clips</div>
                                <div><span className="font-bold">{profileUser.followers?.length ?? 0}</span> Followers</div>
                                <div><span className="font-bold">{profileUser.following?.length ?? 0}</span> Following</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                     {currentUser && currentUser.uid !== profileUser.uid && (
                        <div className="flex gap-2 mb-8">
                            <Button className="flex-1" onClick={handleFollow} variant={isFollowing ? 'secondary' : 'default'} disabled={isFollowLoading}>
                                {isFollowLoading ? <Loader2 className="animate-spin" /> : isFollowing ? <UserCheck /> : <UserPlus />}
                                <span className="ml-2">{isFollowing ? 'Following' : 'Follow'}</span>
                            </Button>
                            <Button className="flex-1" variant="outline" onClick={handleStartChat} disabled={isChatting}>
                                {isChatting ? <Loader2 className="animate-spin" /> : <MessageCircle />}
                                <span className="ml-2">Chat</span>
                            </Button>
                        </div>
                    )}

                    {/* Clips Grid */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Clips</h3>
                        {userClips.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {userClips.map(clip => (
                                    <Link href="/clips" key={clip.id}>
                                        <div className="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
                                            <video 
                                                src={clip.videoUrl} 
                                                className="w-full h-full object-cover" 
                                                preload="metadata"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <Play className="h-8 w-8 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                                <Video className="h-16 w-16 mb-4" />
                                <p className="font-semibold">No clips yet</p>
                                <p className="text-sm">{profileUser.name} hasn't posted any clips.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

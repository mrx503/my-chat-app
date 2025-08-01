
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, orderBy, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Clip, Chat, AppNotification } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Video, Loader2, Play, UserPlus, UserCheck, Camera, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Lightbox from '@/components/lightbox';

const CLOUDINARY_CLOUD_NAME = 'dqgchsg6k';

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
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    
    const isOwnProfile = currentUser?.uid === userId;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, router, toast, currentUser?.following]);
    
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
        const currentlyFollowing = isFollowing;
        
        // Optimistic UI updates
        setIsFollowing(!currentlyFollowing);
        setProfileUser(prev => prev ? ({
            ...prev,
            followers: currentlyFollowing 
                ? prev.followers?.filter(id => id !== currentUser.uid)
                : [...(prev.followers || []), currentUser.uid]
        }) : null);

        try {
            await runTransaction(db, async (transaction) => {
                transaction.update(currentUserRef, { following: currentlyFollowing ? arrayRemove(profileUser.id) : arrayUnion(profileUser.id) });
                transaction.update(profileUserRef, { followers: currentlyFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
            });

             // After transaction succeeds, update context and create notification
            updateCurrentUser({
                following: currentlyFollowing
                    ? currentUser.following?.filter(id => id !== profileUser.id)
                    : [...(currentUser.following || []), profileUser.id]
            });
             if (!currentlyFollowing) {
                await createNotification('follow', profileUser.id);
            }

            toast({
                title: currentlyFollowing ? 'Unfollowed' : 'Followed!',
                description: `You are now ${currentlyFollowing ? 'unfollowing' : 'following'} ${profileUser?.name}.`,
            });
        } catch (error) {
            console.error("Follow/unfollow error:", error);
            // Revert optimistic updates on error
            setIsFollowing(currentlyFollowing);
            setProfileUser(prev => prev ? ({
                ...prev,
                followers: currentlyFollowing 
                    ? [...(prev.followers || []), currentUser.uid]
                    : prev.followers?.filter(id => id !== currentUser.uid)
            }) : null);
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

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
            return;
        }

        toast({ title: 'Uploading...', description: 'Your new avatar is being uploaded.' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'duck-chat');

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const avatarUrl = data.secure_url;
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, { avatar: avatarUrl });
            
            updateCurrentUser({ avatar: avatarUrl });
            setProfileUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);

            toast({ title: 'Success!', description: 'Your profile picture has been updated.' });
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
             if (event.target) event.target.value = '';
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
        <>
            <Lightbox
                imageUrl={lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
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
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
                            <div className="relative">
                                <Avatar 
                                    className="w-24 h-24 sm:w-32 sm:h-32 text-4xl border-4 border-primary/20 cursor-pointer"
                                    onClick={() => profileUser.avatar && setLightboxImage(profileUser.avatar)}
                                >
                                    <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                                    <AvatarFallback>{profileUser.name?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {isOwnProfile && (
                                    <>
                                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
                                        <Button size="icon" className="absolute bottom-1 right-1 rounded-full h-9 w-9" onClick={() => avatarInputRef.current?.click()}>
                                            <Camera className="h-5 w-5"/>
                                        </Button>
                                    </>
                                )}
                            </div>
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
                        {currentUser && !isOwnProfile && (
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
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden relative group cursor-pointer">
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
        </>
    );
}

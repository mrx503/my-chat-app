
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, startAfter, serverTimestamp, addDoc, doc, updateDoc, arrayUnion, arrayRemove, runTransaction, getDoc, increment, writeBatch, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Clip, AppNotification, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ArrowLeft, Video, Plus, Loader2, Play, Gift, Flag, Trash2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UploadClipModal from '@/components/upload-clip-modal';
import { cn } from '@/lib/utils';
import CommentsModal from '@/components/comments-modal';
import SupportModal from '@/components/support-modal';
import ReportClipModal from '@/components/report-clip-modal';
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

const ClipPlayer = ({ 
    clip, onLike, onComment, onSupport, onReport, onDelete, 
    currentUser, uploaderName, uploaderAvatar, uploaderId, isUploaderVerified
}: { 
    clip: Clip, 
    onLike: (clip: Clip) => void, 
    onComment: (clipId: string) => void, 
    onSupport: (clip: Clip) => void, 
    onReport: (clip: Clip) => void,
    onDelete: (clipId: string) => void,
    currentUser: (User & {uid: string}) | null, 
    uploaderName: string, 
    uploaderAvatar: string, 
    uploaderId: string,
    isUploaderVerified?: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true); // Autoplay by default
    const { toast } = useToast();
    const router = useRouter();

    const isLiked = currentUser ? clip.likes.includes(currentUser.uid) : false;
    const isOwnClip = currentUser?.uid === uploaderId;

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };
    
    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            toast({ variant: 'destructive', title: "Login Required", description: "You need to be logged in to like a clip." });
            return;
        }
        onLike(clip);
    };
    
     const handleSupportClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOwnClip) {
             toast({ variant: 'destructive', title: "Action not allowed", description: "You cannot support your own clip." });
             return;
        }
         if (!currentUser) {
            toast({ variant: 'destructive', title: "Login Required", description: "You need to be logged in to support a creator." });
            return;
        }
        onSupport(clip);
    };

    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            toast({ variant: 'destructive', title: "Login Required", description: "You need to be logged in to comment." });
            return;
        }
        onComment(clip.id);
    }
    
    const handleReportClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOwnClip) return;
        if (!currentUser) {
            toast({ variant: 'destructive', title: "Login Required", description: "You need to be logged in to report content." });
            return;
        }
        onReport(clip);
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOwnClip) return;
        onDelete(clip.id);
    }

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/profile/${uploaderId}`);
    }


    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                    setIsPlaying(true);
                } else {
                    video.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
            if (video) {
                video.pause();
            }
        };
    }, []);

    return (
        <div className="relative h-full w-full snap-start bg-black flex items-center justify-center" onClick={togglePlay}>
            <video
                ref={videoRef}
                src={clip.videoUrl}
                loop
                playsInline
                className="w-full h-full object-contain"
            />
            
            {!isPlaying && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-20 w-20 text-white/70" />
                </div>
            )}
            
            <div className="absolute bottom-16 sm:bottom-4 left-0 right-0 p-4 flex justify-between items-end">
                <div className="text-white w-[75%] space-y-2">
                    <button className="flex items-center gap-2 text-left" onClick={handleProfileClick}>
                        <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarImage src={uploaderAvatar} alt={uploaderName} />
                            <AvatarFallback>{uploaderName?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-lg flex items-center gap-1.5">
                            {uploaderName}
                            {isUploaderVerified && <ShieldCheck className="h-5 w-5 text-white" />}
                        </p>
                    </button>
                    <p className="text-sm">{clip.caption}</p>
                </div>

                <div className="flex flex-col-reverse items-center gap-5 text-white">
                    {isOwnClip ? (
                         <AlertDialogTrigger asChild>
                            <button className="flex flex-col items-center gap-1" onClick={handleDeleteClick}>
                                <Trash2 className="h-8 w-8 text-red-500" />
                                <span className="text-xs font-semibold">Delete</span>
                            </button>
                         </AlertDialogTrigger>
                    ) : (
                        <button className="flex flex-col items-center gap-1" onClick={handleReportClick}>
                            <Flag className="h-8 w-8" />
                            <span className="text-xs font-semibold">Report</span>
                        </button>
                    )}

                    {!isOwnClip &&
                        <button className="flex flex-col items-center gap-1" onClick={handleSupportClick}>
                            <Gift className="h-8 w-8" />
                            <span className="text-xs font-semibold">Support</span>
                        </button>
                    }
                    <button className="flex flex-col items-center gap-1" onClick={handleCommentClick}>
                        <MessageCircle className="h-8 w-8" />
                        <span className="text-xs font-semibold">{clip.commentsCount || 0}</span>
                    </button>
                    <button className="flex flex-col items-center gap-1" onClick={handleLikeClick}>
                        <Heart className={cn("h-8 w-8 transition-colors", isLiked && "fill-red-500 text-red-500")} />
                        <span className="text-xs font-semibold">{clip.likes.length || 0}</span>
                    </button>
                </div>
            </div>

        </div>
    );
};


export default function ClipsPage() {
    const { currentUser, updateCurrentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [clips, setClips] = useState<Clip[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
    const [clipToDelete, setClipToDelete] = useState<string | null>(null);

    const observer = useRef<IntersectionObserver>();
    const lastClipElementRef = useRef(null);

    const fetchClips = async (initial = false) => {
        if (!hasMore && !initial) return;
        
        if (initial) {
             setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const clipsRef = collection(db, 'clips');
            let q;
            if (lastVisible && !initial) {
                q = query(clipsRef, orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(5));
            } else {
                q = query(clipsRef, orderBy('timestamp', 'desc'), limit(5));
            }

            const documentSnapshots = await getDocs(q);
            
            if (documentSnapshots.empty) {
                setHasMore(false);
                if (initial) setClips([]);
                return;
            }

            // Fetch uploader info for each clip
            const newClipsPromises = documentSnapshots.docs.map(async (docSnapshot) => {
                const clipData = { id: docSnapshot.id, ...docSnapshot.data() } as Clip;
                
                const userDoc = await getDoc(doc(db, 'users', clipData.uploaderId));
                if (userDoc.exists()) {
                    const uploaderData = userDoc.data();
                    clipData.uploaderName = uploaderData.name || 'Unknown';
                    clipData.uploaderAvatar = uploaderData.avatar || '';
                    clipData.isUploaderVerified = uploaderData.isVerified || false;
                } else {
                    clipData.uploaderName = 'Unknown User';
                    clipData.uploaderAvatar = '';
                    clipData.isUploaderVerified = false;
                }
                return clipData;
            });

            const newClips = await Promise.all(newClipsPromises);

            const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            
            setLastVisible(lastDoc);

            if (initial) {
                setClips(newClips);
            } else {
                setClips(prev => [...prev, ...newClips.filter(nc => !prev.some(pc => pc.id === nc.id))]);
            }

        } catch (error) {
            console.error("Error fetching clips:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch clips.' });
        } finally {
             setLoading(false);
             setLoadingMore(false);
        }
    };
    
    useEffect(() => {
        fetchClips(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        if (loadingMore || !hasMore || !lastClipElementRef.current) return;

        const currentObserver = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                fetchClips();
            }
        });

        if (lastClipElementRef.current) {
            currentObserver.observe(lastClipElementRef.current);
        }

        observer.current = currentObserver;

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clips, hasMore, loadingMore]);


    const handleUploadComplete = async (videoUrl: string, caption: string) => {
        if (!currentUser) return;

        try {
            const newClipData = {
                videoUrl,
                caption,
                uploaderId: currentUser.uid,
                timestamp: serverTimestamp(),
                likes: [],
                commentsCount: 0,
            };
            
            const docRef = await addDoc(collection(db, 'clips'), newClipData);
            
            // Create a client-side version of the clip to prepend to the list
            const newClipWithId: Clip = { 
                id: docRef.id, 
                ...newClipData,
                uploaderName: currentUser.name || currentUser.email!,
                uploaderAvatar: currentUser.avatar,
                isUploaderVerified: currentUser.isVerified,
                timestamp: new Date() 
            } as any; // Cast because serverTimestamp is different from Date
            
            setClips(prevClips => [newClipWithId, ...prevClips]);
            setIsUploadModalOpen(false);
            toast({ title: 'Success!', description: 'Your clip has been uploaded.' });

        } catch (error) {
            console.error("Error adding new clip:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not save your clip.' });
        }
    };

    const handleLike = async (clip: Clip) => {
        if (!currentUser) return;

        const clipRef = doc(db, 'clips', clip.id);
        const isLiked = clip.likes.includes(currentUser.uid);

        // Optimistic update
        setClips(prevClips => prevClips.map(c => {
            if (c.id === clip.id) {
                return {
                    ...c,
                    likes: isLiked 
                        ? c.likes.filter(id => id !== currentUser.uid)
                        : [...c.likes, currentUser.uid]
                };
            }
            return c;
        }));

        try {
            if (isLiked) {
                await updateDoc(clipRef, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(clipRef, { likes: arrayUnion(currentUser.uid) });
                // Send notification only if it's not our own clip
                if (currentUser.uid !== clip.uploaderId) {
                    const notifRef = collection(db, 'notifications');
                    const newNotification: AppNotification = {
                        recipientId: clip.uploaderId,
                        senderId: currentUser.uid,
                        senderName: currentUser.name || currentUser.email!,
                        senderAvatar: currentUser.avatar,
                        type: 'like',
                        resourceId: clip.id,
                        read: false,
                        timestamp: serverTimestamp() as any
                    };
                    await addDoc(notifRef, newNotification);
                }
            }
        } catch (error) {
            console.error("Error updating like:", error);
            // Revert optimistic update on error
             setClips(prevClips => prevClips.map(c => {
                if (c.id === clip.id) {
                    return { ...c, likes: clip.likes };
                }
                return c;
            }));
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update like.' });
        }
    };

    const handleOpenComments = (clipId: string) => {
        setSelectedClip(clips.find(c => c.id === clipId) || null);
        setIsCommentsModalOpen(true);
    };
    
    const handleOpenSupport = (clip: Clip) => {
        setSelectedClip(clip);
        setIsSupportModalOpen(true);
    };

    const handleOpenReport = (clip: Clip) => {
        setSelectedClip(clip);
        setIsReportModalOpen(true);
    }
    
    const handleDeleteClipRequest = (clipId: string) => {
        setClipToDelete(clipId);
    }
    
    const confirmDeleteClip = async () => {
        if (!clipToDelete) return;
        try {
            // Delete associated reports first
            const reportsQuery = query(collection(db, 'reports'), where('clipId', '==', clipToDelete));
            const reportsSnapshot = await getDocs(reportsQuery);
            const batch = writeBatch(db);
            reportsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Delete the clip
            await deleteDoc(doc(db, 'clips', clipToDelete));

            setClips(prev => prev.filter(c => c.id !== clipToDelete));
            toast({title: "Clip Deleted", description: "The clip has been permanently removed."});

        } catch(error) {
            console.error("Error deleting clip:", error);
            toast({variant: 'destructive', title: 'Error', description: 'Could not delete the clip.'});
        } finally {
            setClipToDelete(null);
        }
    }


    const handleCommentsUpdate = (clipId: string, newCount: number) => {
        setClips(prevClips => prevClips.map(clip => {
            if (clip.id === clipId) {
                return { ...clip, commentsCount: newCount };
            }
            return clip;
        }));
    };
    
    const handleReportSubmit = async (reason: string, customReason?: string) => {
        if (!selectedClip || !currentUser) return;

        try {
            const reportData = {
                clipId: selectedClip.id,
                videoUrl: selectedClip.videoUrl,
                reporterId: currentUser.uid,
                reporterEmail: currentUser.email,
                reportedUserId: selectedClip.uploaderId,
                reportedUserEmail: selectedClip.uploaderName, // We are storing email in the name field for now
                reason,
                customReason: customReason || '',
                status: 'pending',
                timestamp: serverTimestamp(),
            };
            await addDoc(collection(db, 'reports'), reportData);
            toast({ title: 'Report Submitted', description: 'Thank you. We will review the content shortly.' });
            setIsReportModalOpen(false);
            setSelectedClip(null);

        } catch (error) {
             console.error("Error submitting report:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your report.' });
        }
    };


    if (loading && clips.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Loading Clips...</p>
            </div>
        );
    }
    
    return (
        <AlertDialog onOpenChange={(open) => !open && setClipToDelete(null)}>
            <div className="h-screen w-screen bg-black overflow-hidden relative">
                <header className="absolute top-0 left-0 z-10 p-4 flex justify-between w-full items-center bg-gradient-to-b from-black/50 to-transparent">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => router.back()}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setIsUploadModalOpen(true)}>
                        <Plus className="mr-2 h-5 w-5" />
                        Upload
                    </Button>
                </header>

                <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll" id="clips-container">
                    {clips.map((clip, index) => (
                        <div ref={index === clips.length - 1 ? lastClipElementRef : null} key={clip.id} className="h-full w-full snap-start relative">
                            <ClipPlayer 
                                clip={clip} 
                                onLike={handleLike} 
                                onComment={handleOpenComments}
                                onSupport={handleOpenSupport}
                                onReport={handleOpenReport}
                                onDelete={handleDeleteClipRequest}
                                currentUser={currentUser}
                                uploaderName={clip.uploaderName}
                                uploaderAvatar={clip.uploaderAvatar}
                                uploaderId={clip.uploaderId}
                                isUploaderVerified={clip.isUploaderVerified}
                            />
                        </div>
                    ))}

                    {loadingMore && (
                        <div className="h-full w-full snap-start flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-white" />
                        </div>
                    )}
                    {!loading && !hasMore && clips.length > 0 && (
                        <div className="h-full w-full snap-start flex items-center justify-center text-white text-center">
                            <div>
                                <p className="text-lg font-semibold">You've reached the end</p>
                                <p className="text-sm text-muted-foreground">Check back later for more clips!</p>
                            </div>
                        </div>
                    )}
                    {!loading && clips.length === 0 && (
                        <div className="h-full w-full flex flex-col items-center justify-center text-white text-center p-4">
                            <Video className="h-20 w-20 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-bold">No Clips Yet</h2>
                            <p className="text-muted-foreground mb-4">Be the first to upload a video!</p>
                            <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4"/> Upload First Clip
                            </Button>
                        </div>
                    )}
                </div>
                
                <UploadClipModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={handleUploadComplete}
                />

                {selectedClip && currentUser && (
                    <CommentsModal 
                        isOpen={isCommentsModalOpen}
                        onClose={() => setIsCommentsModalOpen(false)}
                        clipId={selectedClip.id}
                        clipUploaderId={selectedClip.uploaderId}
                        currentUser={currentUser}
                        onCommentsUpdate={handleCommentsUpdate}
                    />
                )}

                {selectedClip && currentUser && (
                    <SupportModal
                        isOpen={isSupportModalOpen}
                        onClose={() => setIsSupportModalOpen(false)}
                        recipient={selectedClip}
                        sender={currentUser}
                        onTransactionComplete={(newBalance) => updateCurrentUser({ coins: newBalance })}
                    />
                )}

                 {selectedClip && currentUser && (
                    <ReportClipModal
                        isOpen={isReportModalOpen}
                        onClose={() => setIsReportModalOpen(false)}
                        onSubmit={handleReportSubmit}
                    />
                 )}
                 
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this clip from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteClip} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </div>
        </AlertDialog>
    );
}

    

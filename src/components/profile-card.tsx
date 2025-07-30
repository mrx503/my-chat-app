
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Camera, Wallet, Clapperboard, User as UserIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface ProfileCardProps {
    currentUser: User & { uid: string };
    updateCurrentUser: (data: Partial<User>) => void;
    logout: () => Promise<void>;
}

export default function ProfileCard({ currentUser, updateCurrentUser, logout }: ProfileCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bio, setBio] = useState('');
    const [isSavingBio, setIsSavingBio] = useState(false);

    useEffect(() => {
        if(currentUser?.bio) {
            setBio(currentUser.bio);
        }
    }, [currentUser?.bio]);

    const copyUserId = () => {
        if (currentUser?.uid) {
            navigator.clipboard.writeText(currentUser.uid);
            toast({ title: 'Copied!', description: 'Your full user ID has been copied to the clipboard.' });
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const compressAndEncode = (file: File, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Failed to get canvas context"));

                    const MAX_WIDTH = 256;
                    const MAX_HEIGHT = 256;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL(file.type, quality);
                    resolve(dataUrl);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && currentUser) {
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select an image file.' });
                return;
            }

            try {
                toast({ title: 'Updating picture...', description: 'Please wait.' });
                
                const dataUrl = await compressAndEncode(file);
                
                const userDocRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userDocRef, { avatar: dataUrl });
                
                updateCurrentUser({ avatar: dataUrl });

                toast({ title: 'Success', description: 'Profile picture updated!' });
            } catch (error) {
                console.error("Error updating avatar:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile picture.' });
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleSaveBio = async () => {
        if (!currentUser) return;
        setIsSavingBio(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
            await updateDoc(userDocRef, { bio });
            updateCurrentUser({ bio });
            toast({ title: 'Success', description: 'Your bio has been updated.' });
        } catch (error) {
            console.error('Error saving bio:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your bio.' });
        } finally {
            setIsSavingBio(false);
        }
    };
    
    const shortUserId = currentUser?.uid ? `${currentUser.uid.substring(0, 6)}...` : '';

    return (
        <div className="lg:col-span-1 space-y-6 lg:mt-0 mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="relative">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                            <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background cursor-pointer hover:bg-primary/80 transition-colors">
                            <Camera className="h-4 w-4 text-primary-foreground"/>
                            <span className="sr-only">Change profile picture</span>
                        </button>
                        <Input id="avatar-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                    <div>
                        <CardTitle>{currentUser.name || currentUser.email}</CardTitle>
                        <CardDescription>Welcome back!</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <span className="text-sm font-mono text-muted-foreground" title={currentUser.uid}>
                                ID: {shortUserId}
                            </span>
                            <Button variant="ghost" size="icon" onClick={copyUserId} className="h-8 w-8">
                                <Copy className="h-4 w-4"/>
                                <span className="sr-only">Copy User ID</span>
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Your Bio</Label>
                            <Textarea 
                                id="bio"
                                placeholder="Tell us a little about yourself..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                             <Button size="sm" onClick={handleSaveBio} disabled={isSavingBio || bio === (currentUser.bio || '')}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSavingBio ? 'Saving...' : 'Save Bio'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                     <div className="grid grid-cols-2 gap-2 w-full">
                         <Button className="w-full" onClick={() => router.push('/wallet')}>
                            <Wallet className="mr-2 h-4 w-4"/>
                            Wallet
                        </Button>
                        <Button className="w-full" variant="outline" onClick={() => router.push(`/profile/${currentUser.uid}`)}>
                            <UserIcon className="mr-2 h-4 w-4"/>
                            Profile
                        </Button>
                         <Button className="w-full col-span-2" variant="secondary" onClick={() => router.push('/clips')}>
                            <Clapperboard className="mr-2 h-4 w-4"/>
                            View Clips
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

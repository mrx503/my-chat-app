"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Camera, Wallet, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

interface ProfileCardProps {
    currentUser: User & { uid: string };
    updateCurrentUser: (data: Partial<User>) => void;
    logout: () => Promise<void>;
}

export default function ProfileCard({ currentUser, updateCurrentUser, logout }: ProfileCardProps) {
    const router = useRouter();
    const { toast } = useToast();

    const copyUserId = () => {
        if (currentUser?.uid) {
            navigator.clipboard.writeText(currentUser.uid);
            toast({ title: 'Copied!', description: 'Your full user ID has been copied to the clipboard.' });
        }
    };

    const compressImage = (file: File, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => { // No event argument needed
                if (!reader.result) {
                    return reject(new Error("FileReader result is null"));
                }
                const img = new Image();
                img.src = reader.result as string; // Use reader.result directly
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error("Failed to get canvas context"));
                    }
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL(file.type, quality));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && currentUser) {
            try {
                toast({ title: 'Uploading...', description: 'Please wait while we update your picture.' });
                const base64 = await compressImage(file);
                const userDocRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userDocRef, { avatar: base64 });
                updateCurrentUser({ avatar: base64 });
                toast({ title: 'Success', description: 'Profile picture updated!' });
            } catch (error) {
                console.error("Error updating avatar:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile picture.' });
            }
        }
        // Reset input to allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const shortUserId = currentUser?.uid ? `${currentUser.uid.substring(0, 6)}...` : '';

    return (
        <div className="lg:col-span-1 space-y-6">
            <header className="flex items-center justify-between p-4 bg-background border-b shadow-sm lg:hidden">
                 <h1 className="text-xl font-bold text-primary">duck</h1>
                 <Button variant="outline" onClick={logout}>
                     <LogOut className="mr-2 h-4 w-4"/>
                     Logout
                 </Button>
            </header>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="relative">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                            <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border-2 border-background cursor-pointer hover:bg-primary/80 transition-colors">
                            <Camera className="h-4 w-4 text-primary-foreground"/>
                        </Label>
                        <Input id="avatar-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <CardTitle>{currentUser.name || currentUser.email}</CardTitle>
                        <CardDescription>Welcome back!</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md mb-4">
                        <span className="text-sm font-mono text-muted-foreground" title={currentUser.uid}>
                            ID: {shortUserId}
                            </span>
                        <Button variant="ghost" size="icon" onClick={copyUserId} className="h-8 w-8">
                            <Copy className="h-4 w-4"/>
                            <span className="sr-only">Copy User ID</span>
                        </Button>
                    </div>
                    <Button className="w-full" onClick={() => router.push('/wallet')}>
                        <Wallet className="mr-2 h-4 w-4"/>
                        View Wallet
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

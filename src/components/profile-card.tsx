
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Wallet, Clapperboard, User as UserIcon, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { getAdminUids } from '@/lib/admin';

interface ProfileCardProps {
    currentUser: User & { uid: string };
    updateCurrentUser: (data: Partial<User>) => void;
    logout: () => Promise<void>;
}

export default function ProfileCard({ currentUser, updateCurrentUser, logout }: ProfileCardProps) {
    const router = useRouter();
    const { toast } = useToast();

    const adminUids = getAdminUids();
    const isAdmin = adminUids.includes(currentUser?.uid);

    const copyUserId = () => {
        if (currentUser?.uid) {
            navigator.clipboard.writeText(currentUser.uid);
            toast({ title: 'Copied!', description: 'Your full user ID has been copied to the clipboard.' });
        }
    };
    
    const shortUserId = currentUser?.uid ? `${currentUser.uid.substring(0, 6)}...` : '';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                        <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{currentUser.name || currentUser.email}</CardTitle>
                        <CardDescription>Welcome back!</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <span className="text-sm font-mono text-muted-foreground" title={currentUser.uid}>
                            ID: {shortUserId}
                        </span>
                        <Button variant="ghost" size="icon" onClick={copyUserId} className="h-8 w-8">
                            <Copy className="h-4 w-4"/>
                            <span className="sr-only">Copy User ID</span>
                        </Button>
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
                            My Profile
                        </Button>
                         <Button className="w-full col-span-2" variant="secondary" onClick={() => router.push('/clips')}>
                            <Clapperboard className="mr-2 h-4 w-4"/>
                            View Clips
                        </Button>
                        {isAdmin && (
                             <Button className="w-full col-span-2" variant="default" onClick={() => router.push('/admin')}>
                                <Shield className="mr-2 h-4 w-4"/>
                                Admin Dashboard
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

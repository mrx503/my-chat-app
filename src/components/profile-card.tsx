
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Wallet, Clapperboard, User as UserIcon, Shield, MessageSquare, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { getAdminUids } from '@/lib/admin';

interface ProfileCardProps {
    currentUser: User & { uid: string };
}

export default function ProfileCard({ currentUser }: ProfileCardProps) {
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
        <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar className="w-12 h-12">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email || ''} data-ai-hint="profile picture"/>
                    <AvatarFallback>{currentUser.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-base flex items-center gap-1.5">
                        <span>{currentUser.name || currentUser.email}</span>
                        {currentUser.isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </CardTitle>
                    <CardDescription className="text-xs">Welcome back!</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-xs font-mono text-muted-foreground" title={currentUser.uid}>
                        ID: {shortUserId}
                    </span>
                    <Button variant="ghost" size="icon" onClick={copyUserId} className="h-7 w-7">
                        <Copy className="h-3 w-3"/>
                        <span className="sr-only">Copy User ID</span>
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4">
                     <Button className="w-full justify-start" variant="ghost" onClick={() => router.push('/chats')}>
                        <MessageSquare className="mr-2 h-4 w-4"/>
                        Chats
                    </Button>
                    <Button className="w-full justify-start" variant="ghost" onClick={() => router.push(`/profile/${currentUser.uid}`)}>
                        <UserIcon className="mr-2 h-4 w-4"/>
                        My Profile
                    </Button>
                     <Button className="w-full justify-start" variant="ghost" onClick={() => router.push('/clips')}>
                        <Clapperboard className="mr-2 h-4 w-4"/>
                        View Clips
                    </Button>
                    <Button className="w-full justify-start" variant="ghost" onClick={() => router.push('/wallet')}>
                        <Wallet className="mr-2 h-4 w-4"/>
                        Wallet
                    </Button>
                     {!currentUser.isVerified && (
                        <Button className="w-full justify-start" variant="ghost" onClick={() => router.push('/verify')}>
                            <ShieldCheck className="mr-2 h-4 w-4"/>
                            Verify Account
                        </Button>
                    )}
                    {isAdmin && (
                        <Button className="w-full justify-start" variant="ghost" onClick={() => router.push('/admin')}>
                            <Shield className="mr-2 h-4 w-4"/>
                            Admin Dashboard
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

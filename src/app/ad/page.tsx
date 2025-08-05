// This file is new
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Loader2, X } from 'lucide-react';
import Script from 'next/script';
import { handleAdViewReward } from '../wallet/actions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

function AdViewer() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser, updateCurrentUser } = useAuth();
    const { toast } = useToast();

    const adId = searchParams.get('adId');
    const uploaderId = searchParams.get('uploaderId');

    const [countdown, setCountdown] = useState(15);
    const [rewardState, setRewardState] = useState<'pending' | 'processing' | 'claimed' | 'error'>('pending');

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (rewardState === 'pending') {
            handleReward();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const handleReward = async () => {
        if (!currentUser || !adId) return;

        setRewardState('processing');

        try {
            const result = await handleAdViewReward(currentUser.uid, adId, uploaderId);
            if (result.success) {
                const viewerReward = uploaderId ? 0.15 : 0.25;
                updateCurrentUser({ coins: (currentUser.coins || 0) + viewerReward });
                setRewardState('claimed');
                toast({
                    title: '💰 Reward Claimed!',
                    description: `You've earned ${viewerReward} coins.`,
                });
                // Redirect back after a short delay
                setTimeout(() => router.back(), 2000);
            } else {
                 setRewardState('error');
                 // Silently fail if reward is already claimed
                 if (result.message !== "Reward already claimed for this ad view.") {
                    toast({ variant: 'destructive', title: 'Error', description: result.message });
                 }
                 setTimeout(() => router.back(), 2000);
            }
        } catch (error) {
            setRewardState('error');
            setTimeout(() => router.back(), 2000);
        }
    };
    
    const handleSkip = () => {
        // Prevent claiming reward if skipped
        setRewardState('error'); 
        router.back();
    };

    const renderStatus = () => {
        switch (rewardState) {
            case 'processing':
                return <p className="text-lg font-semibold flex items-center gap-2"><Loader2 className="animate-spin" /> Processing reward...</p>;
            case 'claimed':
                return <p className="text-lg font-semibold flex items-center gap-2 text-green-500"><CheckCircle /> Success! Redirecting...</p>;
            case 'error':
                 return <p className="text-lg font-semibold flex items-center gap-2 text-destructive">Could not claim reward. Redirecting...</p>;
            default:
                return <p className="text-2xl font-bold">{countdown}</p>;
        }
    }


    if (!adId) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <p className="text-destructive">Invalid ad link. Going back...</p>
                {useEffect(() => { router.back() }, [router])}
             </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-muted/40">
            <header className="flex items-center justify-between p-4 bg-background border-b shadow-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={router.back}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold ml-4">Sponsored Content</h1>
                <Button variant="outline" onClick={handleSkip} disabled={rewardState !== 'pending'}>
                    <X className="mr-2 h-4 w-4" /> Skip
                </Button>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
                 <Card className="w-full max-w-4xl">
                    <CardHeader>
                        <CardTitle>Advertisement</CardTitle>
                        <CardDescription>This is a sponsored message. Your reward will be granted after the timer below ends.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Script
                            async
                            data-cfasync="false"
                            src="//pl27352294.profitableratecpm.com/00e07313ed1c696e0bdf39d02c7c3e2c/invoke.js"
                            strategy="lazyOnload"
                        />
                        <div id="container-00e07313ed1c696e0bdf39d02c7c3e2c" className="min-h-[250px] flex items-center justify-center bg-muted/50 rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex flex-col items-center justify-center h-24 w-24 rounded-full bg-background border-4 border-primary text-primary">
                   {renderStatus()}
                </div>
            </main>
        </div>
    )
}


export default function AdPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
            <AdViewer />
        </Suspense>
    );
}

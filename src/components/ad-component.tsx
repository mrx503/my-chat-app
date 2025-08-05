
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { handleAdViewReward } from '@/app/wallet/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import type { User } from '@/lib/types';
import { Button } from './ui/button';
import { Loader2, Coins, Tv, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Progress } from './ui/progress';

interface AdComponentProps {
    currentUser: User & { uid: string };
    onReward: (amount: number) => void;
    adId: string; // Unique ID for the ad (e.g., post ID or interstitial ID)
    uploaderId?: string; // UID of the content creator
    isInterstitial?: boolean; // If true, displays as a larger card
}

const AD_REWARD_DURATION = 15; // 15 seconds

const AdComponent: React.FC<AdComponentProps> = ({ currentUser, onReward, adId, uploaderId, isInterstitial = false }) => {
    const { toast } = useToast();
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const viewerReward = uploaderId ? 0.15 : 0.25;

    const startRewardTimer = () => {
        setIsProcessing(true);

        // Timer for progress bar
        setProgress(0);
        let currentProgress = 0;
        progressTimerRef.current = setInterval(() => {
            currentProgress += 1;
            setProgress((currentProgress / AD_REWARD_DURATION) * 100);
        }, 1000);

        // Timer for actual reward
        timerRef.current = setTimeout(async () => {
            const result = await handleAdViewReward(currentUser.uid, adId, uploaderId);
            
            if (result.success) {
                onReward(viewerReward); // Update local state
                toast({
                    title: "💰 Reward!",
                    description: `You've earned ${viewerReward} coins.`,
                });
            } else if (result.message !== "Reward already claimed for this ad view.") {
                toast({
                    variant: "destructive",
                    title: "Reward Error",
                    description: result.message,
                });
            }
            // If already claimed, fail silently.
            
            cleanUp();
            setIsAdModalOpen(false);
        }, AD_REWARD_DURATION * 1000);
    };
    
    const cleanUp = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsProcessing(false);
        setProgress(0);
    };

    const handleOpenModal = () => {
        setIsAdModalOpen(true);
        startRewardTimer();
    };
    
    const handleCloseModal = () => {
        cleanUp();
        setIsAdModalOpen(false);
    }
    
    // Cleanup timers on component unmount
    useEffect(() => {
        return () => cleanUp();
    }, []);

    const adContent = (
        <>
            <Script
                async
                data-cfasync="false"
                src="//pl27352294.profitableratecpm.com/00e07313ed1c696e0bdf39d02c7c3e2c/invoke.js"
                strategy="lazyOnload"
            />
            <div id="container-00e07313ed1c696e0bdf39d02c7c3e2c" className="min-h-[250px] flex items-center justify-center bg-muted/50 rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </>
    );

    if (isInterstitial) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <Coins className="h-5 w-5" />
                        <span>Sponsored</span>
                    </CardTitle>
                    <CardDescription>An opportunity to earn free coins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Watch a short ad from our sponsors and get rewarded!</p>
                </CardContent>
                <CardFooter>
                     <Button onClick={handleOpenModal} className="w-full">
                        <Tv className="mr-2 h-4 w-4" /> Watch Ad & Earn {viewerReward} Coins
                    </Button>
                </CardFooter>

                <Dialog open={isAdModalOpen} onOpenChange={handleCloseModal}>
                    <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Sponsored Content</DialogTitle>
                            <DialogDescription>Your reward will be granted after the timer finishes.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {adContent}
                        </div>
                        <DialogFooter className="sm:justify-start">
                             <div className="w-full space-y-2">
                                <Progress value={progress} />
                                <p className="text-xs text-muted-foreground text-center">Please wait {AD_REWARD_DURATION - Math.floor(progress / 100 * AD_REWARD_DURATION)} seconds...</p>
                             </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        );
    }

    // Default inline version (under posts)
    return (
        <>
            <Button variant="outline" size="sm" className="w-full" onClick={handleOpenModal}>
                <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                Watch Ad & Earn {viewerReward} Coins
            </Button>

            <Dialog open={isAdModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Sponsored Content</DialogTitle>
                        <DialogDescription>Your reward will be granted after the timer finishes.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {adContent}
                    </div>
                    <DialogFooter className="sm:justify-start">
                         <div className="w-full space-y-2">
                            <Progress value={progress} />
                            <p className="text-xs text-muted-foreground text-center">Please wait {AD_REWARD_DURATION - Math.floor(progress / 100 * AD_REWARD_DURATION)} seconds...</p>
                         </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdComponent;

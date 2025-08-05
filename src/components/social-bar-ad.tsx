// This file is new
"use client";

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { Button } from './ui/button';
import { Coins, Loader2, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAdViewReward } from '@/app/wallet/actions';
import type { User } from '@/lib/types';

interface SocialBarAdProps {
    currentUser: User & { uid: string };
    onReward: (amount: number) => void;
    adId: string;
}

const SocialBarAd: React.FC<SocialBarAdProps> = ({ currentUser, onReward, adId }) => {
    const [adState, setAdState] = useState<'idle' | 'watching' | 'claimable' | 'claimed'>('idle');
    const [countdown, setCountdown] = useState(15);
    const { toast } = useToast();
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (adState === 'watching' && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (adState === 'watching' && countdown === 0) {
            setAdState('claimable');
        }
        return () => clearTimeout(timer);
    }, [adState, countdown]);
    
    const handleWatchAd = () => {
        setAdState('watching');
        setScriptLoaded(true); // Trigger script injection
    };
    
    const handleClaimReward = async () => {
        setAdState('claimed');
        try {
            const result = await handleAdViewReward(currentUser.uid, adId, null);
            if (result.success) {
                onReward(0.25);
                toast({
                    title: '💰 Reward Claimed!',
                    description: "You've earned 0.25 coins.",
                });
            } else if (result.message !== "Reward already claimed for this ad view.") {
                // Show error only if it's not a 'duplicate' error
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not claim reward.' });
        }
    };

    const renderButton = () => {
        switch(adState) {
            case 'watching':
                return (
                    <Button className="w-full" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claim in {countdown}s
                    </Button>
                );
            case 'claimable':
                 return (
                    <Button className="w-full" onClick={handleClaimReward} variant="success">
                        <PartyPopper className="mr-2 h-4 w-4" />
                        Claim Reward
                    </Button>
                );
            case 'claimed':
                return (
                     <Button className="w-full" disabled variant="secondary">
                        Reward Claimed
                    </Button>
                );
            case 'idle':
            default:
                return (
                    <Button className="w-full" onClick={handleWatchAd}>
                        <Coins className="mr-2 h-4 w-4" />
                        Watch Ad & Earn 0.25 Coins
                    </Button>
                );
        }
    };


    return (
        <>
            {scriptLoaded && (
                <Script 
                    id="social-bar-script"
                    strategy="lazyOnload"
                    src="//pl27352004.profitableratecpm.com/0d/99/80/0d99803bd2cbf2d1413181d1424667bb.js"
                />
            )}
             <div className="p-4 border rounded-lg bg-background">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                    <Coins className="h-5 w-5" />
                    <span>Sponsored Content</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                   Watch a short ad from our sponsors to earn free coins. The ad will appear floating on the page.
                </p>
                {renderButton()}
            </div>
        </>
    );
};

export default SocialBarAd;

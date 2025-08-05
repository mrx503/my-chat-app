"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Coins, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAdViewReward } from '@/app/wallet/actions';
import type { User } from '@/lib/types';

interface SocialBarAdProps {
    currentUser: User & { uid: string };
    onReward: (amount: number) => void;
    adId: string;
}

const DIRECT_AD_LINK = 'https://otieu.com/4/9674522';

const SocialBarAd: React.FC<SocialBarAdProps> = ({ currentUser, onReward, adId }) => {
    const [isClaimed, setIsClaimed] = useState(false);
    const { toast } = useToast();
    
    const handleViewAd = async () => {
        if (isClaimed) return;

        // Open the ad link in a new tab
        window.open(DIRECT_AD_LINK, '_blank');
        
        // Mark as claimed immediately to prevent multiple clicks
        setIsClaimed(true);

        try {
            const result = await handleAdViewReward(currentUser.uid, adId, null);
            if (result.success) {
                onReward(0.25);
                toast({
                    title: '💰 Reward Claimed!',
                    description: "You've earned 0.25 coins.",
                });
            } else if (result.message !== "Reward already claimed for this ad view.") {
                // Show error only if it's not a 'duplicate' error, and revert state
                toast({ variant: 'destructive', title: 'Error', description: result.message });
                setIsClaimed(false); // Allow user to try again if there was an error
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not claim reward.' });
            setIsClaimed(false); // Allow user to try again
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-background">
            <h3 className="font-bold flex items-center gap-2 text-primary">
                <Coins className="h-5 w-5" />
                <span>Sponsored Content</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
                View a quick ad from our sponsors to earn free coins.
            </p>
            <Button className="w-full" onClick={handleViewAd} disabled={isClaimed}>
                {isClaimed ? (
                    <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Reward Claimed
                    </>
                ) : (
                    <>
                        <Coins className="mr-2 h-4 w-4" />
                        View Ad & Earn 0.25 Coins
                    </>
                )}
            </Button>
        </div>
    );
};

export default SocialBarAd;

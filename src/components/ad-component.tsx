
"use client";

import React, { useState, useRef } from 'react';
import Script from 'next/script';
import { handleAdViewReward } from '@/app/wallet/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { User } from '@/lib/types';
import { Button } from './ui/button';
import { Loader2, Coins } from 'lucide-react';

interface AdComponentProps {
    currentUser: User;
    onReward: (amount: number) => void;
}

const AD_REWARD_AMOUNT = 0.25;
const AD_VIEW_DURATION = 15000; // 15 seconds

const AdComponent: React.FC<AdComponentProps> = ({ currentUser, onReward }) => {
    const { toast } = useToast();
    const [showAd, setShowAd] = useState(false);
    const [isRewarding, setIsRewarding] = useState(false);
    const adRewardTimer = useRef<NodeJS.Timeout | null>(null);

    const handleWatchAd = () => {
        setShowAd(true);
        setIsRewarding(true);
        
        // Start a timer to grant the reward after 15 seconds
        adRewardTimer.current = setTimeout(async () => {
            const result = await handleAdViewReward(currentUser.uid, 'wallet-ad-1');
            if (result.success) {
                onReward(AD_REWARD_AMOUNT);
                toast({
                    title: "💰 Reward!",
                    description: `You've earned ${AD_REWARD_AMOUNT} coins for watching an ad.`,
                });
            } else if (result.message !== "Reward already claimed for this ad view.") {
                // Only show error for unexpected issues, not for already claimed rewards
                toast({
                    variant: "destructive",
                    title: "Reward Error",
                    description: result.message,
                });
            }
            setIsRewarding(false);
            setShowAd(false); // Hide the ad after reward cycle is complete
        }, AD_VIEW_DURATION);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <span>Earn Free Coins</span>
                </CardTitle>
                 <CardDescription>
                    Watch a short ad to earn {AD_REWARD_AMOUNT} coins.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {showAd ? (
                    <div className="space-y-4">
                        {/* The ad script and container */}
                        <Script
                            async
                            data-cfasync="false"
                            src="//pl27352294.profitableratecpm.com/00e07313ed1c696e0bdf39d02c7c3e2c/invoke.js"
                            strategy="lazyOnload"
                        />
                        <div id="container-00e07313ed1c696e0bdf39d02c7c3e2c"></div>

                        {isRewarding && (
                            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span>Rewarding in a few seconds...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <Button onClick={handleWatchAd} className="w-full">
                        Watch Ad and Earn
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default AdComponent;

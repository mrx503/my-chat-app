
"use client";

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { handleAdViewReward } from '@/app/wallet/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

interface AdComponentProps {
    adId: string;
    viewerId?: string;
    postOwnerId?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({ adId, viewerId, postOwnerId }) => {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const adContainerRef = useRef<HTMLDivElement>(null);
    const hasBeenRewarded = useRef(false);

    useEffect(() => {
        if (!currentUser || !adContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !hasBeenRewarded.current) {
                    // Start a timer when the ad becomes visible
                    const timer = setTimeout(async () => {
                        if (hasBeenRewarded.current) return; // Double check

                        hasBeenRewarded.current = true; // Mark as rewarded to prevent multiple calls
                        
                        const result = await handleAdViewReward(currentUser.uid, adId, postOwnerId);

                        if (result.success) {
                            let rewardAmount = postOwnerId ? 0.15 : 0.25;
                            toast({
                                title: "💰 Reward!",
                                description: `You've earned ${rewardAmount} coins for watching an ad.`,
                            });
                        }
                        // We don't show an error toast to the user to keep the experience smooth
                    }, 15000); // 15 seconds to count as a "full watch"

                    // Clean up the timer if the component is unmounted or no longer intersecting
                    return () => clearTimeout(timer);
                }
            },
            { threshold: 0.75 } // At least 75% of the ad must be visible
        );

        observer.observe(adContainerRef.current);

        return () => {
            observer.disconnect();
        };

    }, [currentUser, adId, postOwnerId, toast]);
    
    // The ad script might try to re-render, so we use a unique container ID
    const containerId = `container-${adId}`;

    return (
        <Card ref={adContainerRef} className="bg-muted/30">
            <CardContent className="p-4">
                <Script
                    async
                    data-cfasync="false"
                    src="//pl27352294.profitableratecpm.com/00e07313ed1c696e0bdf39d02c7c3e2c/invoke.js"
                    strategy="lazyOnload"
                />
                <div id={containerId}></div>
            </CardContent>
        </Card>
    );
};

export default AdComponent;

    
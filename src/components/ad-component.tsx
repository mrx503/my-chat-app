"use client";

import React from 'react';
import type { User } from '@/lib/types';
import { Button } from './ui/button';
import { Coins, Tv } from 'lucide-react';
import Link from 'next/link';

interface AdComponentProps {
    currentUser: User & { uid: string };
    onReward: (amount: number) => void;
    adId: string; // Unique ID for the ad (e.g., post ID or interstitial ID)
    uploaderId?: string; // UID of the content creator
    isInterstitial?: boolean; // If true, displays as a larger card
}

const AdComponent: React.FC<AdComponentProps> = ({ currentUser, adId, uploaderId, isInterstitial = false }) => {
    const viewerReward = uploaderId ? 0.15 : 0.25;

    // Construct the URL with query parameters
    const adUrl = `/ad?adId=${adId}${uploaderId ? `&uploaderId=${uploaderId}` : ''}`;

    if (isInterstitial) {
        return (
             <div className="p-4 border rounded-lg bg-background">
                <h3 className="font-bold flex items-center gap-2 text-yellow-500">
                    <Coins className="h-5 w-5" />
                    <span>Sponsored</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Watch a short ad from our sponsors to earn free coins.
                </p>
                <Button asChild className="w-full">
                    <Link href={adUrl}>
                        <Tv className="mr-2 h-4 w-4" /> Watch Ad & Earn {viewerReward} Coins
                    </Link>
                </Button>
            </div>
        );
    }

    // Default inline version (under posts)
    return (
        <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={adUrl}>
                <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                Watch Ad & Earn {viewerReward} Coins
            </Link>
        </Button>
    );
};

export default AdComponent;

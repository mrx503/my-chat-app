
"use server";

import { db } from "@/lib/firebase";
import { doc, increment, runTransaction, writeBatch } from "firebase/firestore";

// Server action to handle rewards for watching an ad
export async function handleAdViewReward(
    viewerId: string, 
    adId: string, 
    postOwnerId?: string
): Promise<{ success: boolean; message: string }> {
    if (!viewerId) {
        return { success: false, message: "User not logged in." };
    }

    const viewerRef = doc(db, 'users', viewerId);
    const rewardLogRef = doc(db, 'adRewardLogs', `${viewerId}_${adId}`);

    try {
        await runTransaction(db, async (transaction) => {
            const rewardLogDoc = await transaction.get(rewardLogRef);
            if (rewardLogDoc.exists()) {
                // User has already been rewarded for this ad view
                throw new Error("Reward already claimed for this ad view.");
            }

            // Viewer gets 0.15 coins
            transaction.update(viewerRef, { coins: increment(0.15) });

            // If the ad is associated with a post, the owner gets 0.25 coins
            if (postOwnerId && postOwnerId !== viewerId) {
                const ownerRef = doc(db, 'users', postOwnerId);
                transaction.update(ownerRef, { coins: increment(0.25) });
            }

            // If it's a general feed ad (no owner), viewer gets 0.25 coins
            if(!postOwnerId){
                transaction.update(viewerRef, { coins: increment(0.25) });
            }

            // Log that the reward has been given to prevent duplicates
            transaction.set(rewardLogRef, {
                viewerId,
                adId,
                timestamp: new Date(),
            });
        });

        return { success: true, message: "Reward processed successfully." };

    } catch (error: any) {
        console.warn("Ad reward processing failed:", error.message);
        return { success: false, message: error.message || "An error occurred while processing the reward." };
    }
}

    
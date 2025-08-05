
"use server";

import { db } from "@/lib/firebase";
import { doc, increment, runTransaction, writeBatch, serverTimestamp } from "firebase/firestore";

// Server action to handle rewards for watching an ad
export async function handleAdViewReward(
    viewerId: string, 
    adId: string, 
): Promise<{ success: boolean; message: string }> {
    if (!viewerId) {
        return { success: false, message: "User not logged in." };
    }

    const viewerRef = doc(db, 'users', viewerId);
    // Use a unique ID for the reward log to prevent duplicate rewards for the same ad session
    const rewardLogRef = doc(db, 'adRewardLogs', `${viewerId}_${adId}`);

    try {
        await runTransaction(db, async (transaction) => {
            const rewardLogDoc = await transaction.get(rewardLogRef);
            if (rewardLogDoc.exists()) {
                throw new Error("Reward already claimed for this ad view.");
            }

            // Viewer gets 0.25 coins
            transaction.update(viewerRef, { coins: increment(0.25) });

            // Log that the reward has been given to prevent duplicates
            transaction.set(rewardLogRef, {
                viewerId,
                adId,
                timestamp: serverTimestamp(),
            });
        });

        return { success: true, message: "Reward processed successfully." };

    } catch (error: any) {
        console.warn("Ad reward processing failed:", error.message);
        return { success: false, message: error.message || "An error occurred while processing the reward." };
    }
}

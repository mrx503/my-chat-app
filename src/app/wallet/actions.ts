
"use server";

import { db } from "@/lib/firebase";
import { doc, increment, runTransaction, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";

// Server action to handle rewards for watching an ad
export async function handleAdViewReward(
    viewerId: string, 
    adId: string, // A unique identifier for the ad instance (e.g., postId or 'interstitial-1')
    uploaderId?: string | null // Optional: The UID of the post/clip owner
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

            const viewerDoc = await transaction.get(viewerRef);
            if (!viewerDoc.exists()) {
                throw new Error("Viewer not found.");
            }

            if (uploaderId && uploaderId !== viewerId) {
                // Ad associated with a post: Viewer gets 0.15, Uploader gets 0.25
                const uploaderRef = doc(db, 'users', uploaderId);
                const uploaderDoc = await transaction.get(uploaderRef);
                if (uploaderDoc.exists()) {
                    transaction.update(uploaderRef, { coins: increment(0.25) });
                }
                transaction.update(viewerRef, { coins: increment(0.15) });
            } else {
                // Interstitial ad (between posts) or self-view: Viewer gets 0.25
                transaction.update(viewerRef, { coins: increment(0.25) });
            }

            // Log that the reward has been given to prevent duplicates for this specific ad
            transaction.set(rewardLogRef, {
                viewerId,
                adId,
                timestamp: serverTimestamp(),
            });
        });

        return { success: true, message: "Reward processed successfully." };

    } catch (error: any) {
        // Return success=false but don't treat "already claimed" as a critical error for the user.
        if (error.message === "Reward already claimed for this ad view.") {
             return { success: false, message: error.message };
        }
        console.error("Ad reward processing failed:", error);
        return { success: false, message: error.message || "An error occurred while processing the reward." };
    }
}

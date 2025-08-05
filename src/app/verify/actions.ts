// This file is new
"use server";

import { db, auth } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";
import { revalidatePath } from "next/cache";

const VERIFICATION_COST = 500;

export async function verifyAccount(): Promise<{ success: boolean; message: string }> {
    const user = auth.currentUser;

    if (!user) {
        return { success: false, message: "You must be logged in to verify your account." };
    }

    const userRef = doc(db, 'users', user.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User data not found.");
            }
            
            const userData = userDoc.data();
            
            if (userData.isVerified) {
                throw new Error("This account is already verified.");
            }
            
            const currentCoins = userData.coins ?? 0;
            if (currentCoins < VERIFICATION_COST) {
                throw new Error("Insufficient coins for verification.");
            }

            // Deduct coins and set verification status
            const newBalance = currentCoins - VERIFICATION_COST;
            transaction.update(userRef, { 
                coins: newBalance,
                isVerified: true
            });
        });

        // Revalidate relevant paths to show the new badge
        revalidatePath('/');
        revalidatePath('/profile');
        revalidatePath('/clips');

        return { success: true, message: "Account verified successfully!" };

    } catch (error: any) {
        console.error("Error during verification transaction:", error);
        return { success: false, message: error.message || "An unexpected server error occurred." };
    }
}

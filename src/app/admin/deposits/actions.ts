// This file is new
"use server";

import { db } from "@/lib/firebase";
import type { DepositRequest } from "@/lib/types";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// This is a server action to handle deposit requests
export async function handleDepositRequest(
  request: DepositRequest,
  action: 'approve' | 'reject'
): Promise<{ success: boolean; message: string }> {
  const requestRef = doc(db, 'depositRequests', request.id!);
  const userRef = doc(db, 'users', request.userId);

  try {
    await runTransaction(db, async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists() || requestDoc.data().status !== 'pending') {
        throw new Error("This request has already been processed or does not exist.");
      }

      if (action === 'approve') {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User associated with this request could not be found.");
        }
        
        const currentCoins = userDoc.data().coins ?? 0;
        const newCoins = currentCoins + request.amount;

        // Update user's coin balance
        transaction.update(userRef, { 
            coins: newCoins,
            systemMessagesQueue: [
                ...(userDoc.data().systemMessagesQueue || []),
                `Your deposit request for ${request.amount} EGP has been approved! The corresponding coins have been added to your balance.`
            ]
        });

        // Update request status
        transaction.update(requestRef, {
          status: 'approved',
          updatedAt: serverTimestamp(),
        });

      } else { // 'reject'
        transaction.update(requestRef, {
          status: 'rejected',
          updatedAt: serverTimestamp(),
        });
        
        // Optionally, send a notification to the user
         const userDoc = await transaction.get(userRef);
         if (userDoc.exists()) {
            transaction.update(userRef, { 
                systemMessagesQueue: [
                    ...(userDoc.data().systemMessagesQueue || []),
                    `Your deposit request for ${request.amount} EGP has been rejected. Please contact support for more details.`
                ]
            });
         }
      }
    });
    
    // Revalidate the path to update the UI
    revalidatePath('/admin/deposits');

    return { success: true, message: `Request successfully ${action === 'approve' ? 'approved' : 'rejected'}.` };
  } catch (error: any) {
    console.error("Error processing deposit request:", error);
    return { success: false, message: error.message || "An unexpected server error occurred." };
  }
}

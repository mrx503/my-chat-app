// This file is new
"use server";

import { db } from "@/lib/firebase";
import type { WithdrawalRequest } from "@/lib/types";
import { doc, runTransaction, serverTimestamp, increment } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function handleWithdrawalRequest(
  request: WithdrawalRequest,
  action: 'approve' | 'reject'
): Promise<{ success: boolean; message: string }> {
  const requestRef = doc(db, 'withdrawalRequests', request.id!);
  const userRef = doc(db, 'users', request.userId);

  try {
    await runTransaction(db, async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists() || requestDoc.data().status !== 'pending') {
        throw new Error("This request has already been processed or does not exist.");
      }
      
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User associated with this request could not be found.");
      }
      const userData = userDoc.data();

      if (action === 'approve') {
        // Just update the request status. The coins have already been deducted.
        transaction.update(requestRef, {
          status: 'approved',
          updatedAt: serverTimestamp(),
        });
        
        // Notify the user of approval
        transaction.update(userRef, { 
            systemMessagesQueue: [
                ...(userData.systemMessagesQueue || []),
                `Your withdrawal request for ${request.amount} coins has been approved and processed.`
            ]
        });

      } else { // 'reject'
        // Refund the coins to the user
        transaction.update(userRef, { 
            coins: increment(request.amount),
            systemMessagesQueue: [
                ...(userData.systemMessagesQueue || []),
                `Your withdrawal request for ${request.amount} coins has been rejected. The coins have been refunded to your balance.`
            ]
        });

        // Update request status to 'rejected'
        transaction.update(requestRef, {
          status: 'rejected',
          updatedAt: serverTimestamp(),
        });
      }
    });
    
    // Revalidate the path to update the UI
    revalidatePath('/admin/withdrawals');
    revalidatePath('/admin/users'); // Also revalidate users page in case of refund

    return { success: true, message: `Request successfully ${action === 'approve' ? 'approved' : 'rejected'}.` };
  } catch (error: any) {
    console.error("Error processing withdrawal request:", error);
    return { success: false, message: error.message || "An unexpected server error occurred." };
  }
}


"use server";

import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

type ActionType = 'ban' | 'unban' | 'restrict';

export async function handleUserAction(
  userId: string,
  action: ActionType,
  days?: number
): Promise<{ success: boolean; message: string }> {
  const userRef = doc(db, 'users', userId);

  try {
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User not found.");
        }

        let updateData: { isBanned?: boolean; bannedUntil?: Timestamp | null } = {};
        let message = '';

        switch(action) {
            case 'ban':
                updateData = { isBanned: true, bannedUntil: null };
                message = `User ${userDoc.data().name} has been permanently banned.`;
                break;
            case 'unban':
                updateData = { isBanned: false, bannedUntil: null };
                message = `All restrictions have been lifted for ${userDoc.data().name}.`;
                break;
            case 'restrict':
                if (!days) throw new Error("Restriction duration not specified.");
                const restrictionEndDate = new Date();
                restrictionEndDate.setDate(restrictionEndDate.getDate() + days);
                updateData = { isBanned: false, bannedUntil: Timestamp.fromDate(restrictionEndDate) };
                message = `User ${userDoc.data().name} has been restricted for ${days} day(s).`;
                break;
        }
        
        transaction.update(userRef, updateData);
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'User status updated successfully.' };
  } catch (error: any) {
    console.error(`Error processing user action (${action}):`, error);
    return { success: false, message: error.message || "An unexpected server error occurred." };
  }
}


export async function sendCoinsToUser(
  userId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
    const userRef = doc(db, 'users', userId);
    
    if (isNaN(amount) || amount <= 0) {
        return { success: false, message: "Invalid amount specified." };
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found.");
            }
            
            const currentCoins = userDoc.data().coins ?? 0;
            const newCoins = currentCoins + amount;
            
            const systemMessage = `An administrator has sent you ${amount} coins! Your new balance is ${newCoins}.`;

            transaction.update(userRef, {
                coins: newCoins,
                systemMessagesQueue: [
                    ...(userDoc.data().systemMessagesQueue || []),
                    systemMessage
                ]
            });
        });

        revalidatePath('/admin/users');
        return { success: true, message: `${amount} coins have been successfully sent.` };
    } catch(error: any) {
        console.error("Error sending coins to user:", error);
        return { success: false, message: error.message || "An unexpected server error occurred." };
    }
}

// This file is new
"use server";

import { db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { doc, updateDoc, arrayUnion, collection, getDocs, writeBatch, query, where } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Fetches all users for the messaging form dropdown
export async function getUsers(): Promise<User[]> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function sendSystemMessage(
  target: 'all' | 'single',
  message: string,
  userId?: string,
): Promise<{ success: boolean; message: string }> {
  if (!message.trim()) {
    return { success: false, message: "Message cannot be empty." };
  }

  try {
    if (target === 'single' && userId) {
      // Send to a single user
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        systemMessagesQueue: arrayUnion(message)
      });
      return { success: true, message: `Message sent to user ${userId}.` };

    } else if (target === 'all') {
      // Send to all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      if (usersSnapshot.empty) {
        return { success: false, message: "No users found to send messages to." };
      }

      const batch = writeBatch(db);
      usersSnapshot.forEach(userDoc => {
        // Exclude system bot from receiving messages
        if (userDoc.id !== 'system-bot-uid') {
          const userRef = doc(db, 'users', userDoc.id);
          batch.update(userRef, {
            systemMessagesQueue: arrayUnion(message)
          });
        }
      });
      await batch.commit();

      return { success: true, message: `Message broadcasted to ${usersSnapshot.size -1} users.` };
    }

    return { success: false, message: "Invalid target or missing user ID." };
  } catch (error: any) {
    console.error("Error sending system message:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

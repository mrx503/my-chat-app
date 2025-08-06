"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch, doc, increment, query, limit } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// This server action simulates granting ad rewards to a number of random users.
// It does NOT interact with any ad networks.
export async function simulateAdRewards(
  simulationCount: number
): Promise<{ success: boolean; message: string }> {
  if (isNaN(simulationCount) || simulationCount <= 0 || simulationCount > 100) {
    return { success: false, message: "Please provide a valid number between 1 and 100." };
  }

  try {
    // 1. Fetch all user IDs, excluding the system bot
    const usersSnapshot = await getDocs(collection(db, "users"));
    const userIds = usersSnapshot.docs
      .map(doc => doc.id)
      .filter(id => id !== 'system-bot-uid');

    if (userIds.length === 0) {
      return { success: false, message: "No users found to grant rewards to." };
    }
    
    // 2. Select random users and prepare batch update
    const batch = writeBatch(db);
    let rewardedCount = 0;
    
    for (let i = 0; i < simulationCount; i++) {
        // Select a random user ID from the list
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const userRef = doc(db, "users", randomUserId);
        
        // Add an update operation to the batch
        // Each simulated view grants 0.25 coins
        batch.update(userRef, { coins: increment(0.25) });
        rewardedCount++;
    }

    // 3. Commit the batch transaction
    await batch.commit();
    
    // Revalidate paths to reflect changes in the UI
    revalidatePath('/admin/users');
    revalidatePath('/admin/rewards-tool');
    revalidatePath('/');


    return { success: true, message: `Successfully granted rewards for ${rewardedCount} simulated views.` };

  } catch (error: any) {
    console.error("Error simulating ad rewards:", error);
    return { success: false, message: error.message || "An unexpected error occurred during the simulation." };
  }
}

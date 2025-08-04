
"use server";

import { db } from "@/lib/firebase";
import { writeBatch, doc, getDocs, collection, query, where, serverTimestamp, arrayUnion } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Action to dismiss a report
export async function dismissReport(reportId: string): Promise<{ success: boolean; message: string }> {
  const reportRef = doc(db, 'reports', reportId);
  try {
    await writeBatch(db).update(reportRef, {
      status: 'dismissed',
      resolvedAt: serverTimestamp()
    }).commit();
    
    revalidatePath('/admin/reports');
    return { success: true, message: "Report dismissed successfully." };

  } catch (error: any) {
    console.error("Error dismissing report:", error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
}

// Action to handle a report by deleting the clip and notifying users
export async function resolveReportAndDeleteClip(reportId: string, clipId: string, reportedUserId: string, reporterId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const batch = writeBatch(db);

    try {
        // 1. Mark the main report as resolved
        const reportRef = doc(db, 'reports', reportId);
        batch.update(reportRef, { 
            status: 'resolved',
            resolvedAt: serverTimestamp()
        });

        // 2. Mark all other pending reports for the same clip as resolved
        const otherReportsQuery = query(collection(db, 'reports'), where('clipId', '==', clipId), where('status', '==', 'pending'));
        const otherReportsSnapshot = await getDocs(otherReportsQuery);
        otherReportsSnapshot.forEach(reportDoc => {
            if(reportDoc.id !== reportId) {
                batch.update(reportDoc.ref, { 
                    status: 'resolved', 
                    resolutionNotes: `Resolved along with report ${reportId}`,
                    resolvedAt: serverTimestamp()
                });
            }
        });

        // 3. Delete the clip document
        const clipRef = doc(db, 'clips', clipId);
        batch.delete(clipRef);

        // 4. Send system message to the reported user
        const reportedUserRef = doc(db, 'users', reportedUserId);
        const penaltyMessage = `Your clip was removed for violating our community guidelines regarding: "${reason}". Repeated violations may lead to account suspension.`;
        batch.update(reportedUserRef, {
            systemMessagesQueue: arrayUnion(penaltyMessage)
        });

        // 5. Send system message to the original reporter
        const reporterUserRef = doc(db, 'users', reporterId);
        const thankYouMessage = `Thank you for your report. We have reviewed the content and taken appropriate action.`;
        batch.update(reporterUserRef, {
            systemMessagesQueue: arrayUnion(thankYouMessage)
        });

        // Commit all batched writes
        await batch.commit();
        
        revalidatePath('/admin/reports');
        return { success: true, message: "Report resolved, clip deleted, and users notified." };
    } catch(error: any) {
         console.error("Error resolving report and deleting clip:", error);
         return { success: false, message: error.message || "An unexpected error occurred." };
    }
}

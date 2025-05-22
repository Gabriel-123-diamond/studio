
"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { DeletionRequestData } from "@/types/requests";
import { sendNotificationAction } from "../../notifications/_actions/sendNotification";
import type { UserData } from "@/types/users";

interface ProcessRequestInput {
  requestId: string;
  targetUserUid: string; // UID of the user to be deleted
  targetStaffId: string; // StaffID of the user for notification message
  targetUserName: string; // Name of the user for notification message
  requestingSupervisorUid: string; // UID of the supervisor who made the request
  requestingSupervisorName: string;
}

export async function approveDeletionRequestAction(
  input: ProcessRequestInput,
  managerUser: { uid: string; name?: string; role: string }
): Promise<{ success: boolean; message: string }> {
  if (managerUser.role !== "manager" && managerUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can approve requests." };
  }

  const requestDocRef = doc(db, "deletionRequests", input.requestId);
  const userToDeleteDocRef = doc(db, "users", input.targetUserUid);

  try {
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data()?.status !== "pending") {
      return { success: false, message: "Request not found or already processed." };
    }

    // Delete user from Firestore 'users' collection
    await deleteDoc(userToDeleteDocRef);
    // IMPORTANT NOTE: Deleting from Firebase Authentication (targetUserUid)
    // requires Admin SDK and should be done in a Cloud Function for security.
    // This action only removes the Firestore record.

    // Update the request status
    await updateDoc(requestDocRef, {
      status: "approved",
      processedByUid: managerUser.uid,
      processedByName: managerUser.name || "Manager/Dev",
      processedTimestamp: serverTimestamp() as Timestamp,
    });

    // Notify the requesting supervisor
    await sendNotificationAction({
      senderId: managerUser.uid,
      senderName: managerUser.name || "System (Approval)",
      senderRole: managerUser.role,
      title: "Deletion Request Approved",
      message: `Your request to delete staff ${input.targetUserName} (ID: ${input.targetStaffId}) has been approved. The user has been removed from Firestore.`,
      // In a real system, you might want to send this notification *only* to input.requestingSupervisorUid
    });
    
    // General notification (optional)
     await sendNotificationAction({
      senderId: managerUser.uid,
      senderName: "System Announcement",
      senderRole: "system",
      title: "Staff Member Removed",
      message: `Staff member ${input.targetUserName} (ID: ${input.targetStaffId}) has been removed from the system.`,
    });


    revalidatePath("/app-dashboard/staff-management");
    revalidatePath("/app-dashboard/approval-requests");
    revalidatePath("/app-dashboard/notifications");

    return { success: true, message: "Deletion request approved. User removed from Firestore." };
  } catch (error: any) {
    console.error("Error approving deletion request:", error);
    return { success: false, message: error.message || "Failed to approve deletion request." };
  }
}

export async function declineDeletionRequestAction(
  requestId: string,
  managerUser: { uid: string; name?: string; role: string },
  feedback?: string,
  // For notification:
  targetStaffId?: string,
  targetUserName?: string,
  requestingSupervisorUid?: string,
  requestingSupervisorName?: string,
): Promise<{ success: boolean; message: string }> {
  if (managerUser.role !== "manager" && managerUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can decline requests." };
  }

  const requestDocRef = doc(db, "deletionRequests", requestId);
  try {
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data()?.status !== "pending") {
      return { success: false, message: "Request not found or already processed." };
    }

    await updateDoc(requestDocRef, {
      status: "declined",
      processedByUid: managerUser.uid,
      processedByName: managerUser.name || "Manager/Dev",
      processedTimestamp: serverTimestamp() as Timestamp,
      managerFeedback: feedback || "",
    });

     // Notify the requesting supervisor
    if(targetUserName && targetStaffId && requestingSupervisorName){
        await sendNotificationAction({
            senderId: managerUser.uid,
            senderName: managerUser.name || "System (Approval)",
            senderRole: managerUser.role,
            title: "Deletion Request Declined",
            message: `Your request to delete staff ${targetUserName} (ID: ${targetStaffId}) has been declined by ${managerUser.name}. Feedback: ${feedback || 'N/A'}`,
             // Ideally, target this notification
        });
    }


    revalidatePath("/app-dashboard/approval-requests");
    revalidatePath("/app-dashboard/notifications");

    return { success: true, message: "Deletion request declined." };
  } catch (error: any) {
    console.error("Error declining deletion request:", error);
    return { success: false, message: error.message || "Failed to decline deletion request." };
  }
}

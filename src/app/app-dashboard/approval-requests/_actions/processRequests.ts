
"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp, deleteDoc, collection } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { DeletionRequestData, AddStaffRequestData } from "@/types/requests";
import { sendNotificationAction } from "../../notifications/_actions/sendNotification";
import type { UserData } from "@/types/users";
import { addUserAction } from "../../staff-management/_actions/manageUsers";

interface ProcessDeletionRequestInput {
  requestId: string;
  targetUserUid: string; 
  targetStaffId: string; 
  targetUserName: string; 
  requestingSupervisorUid: string; 
  requestingSupervisorName: string;
}

export async function approveDeletionRequestAction(
  input: ProcessDeletionRequestInput,
  managerUser: { uid: string; name?: string; role: string }
): Promise<{ success: boolean; message: string }> {
  if (managerUser.role !== "manager" && managerUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can approve deletion requests." };
  }

  const requestDocRef = doc(db, "deletionRequests", input.requestId);
  // Note: targetUserUid might be a placeholder if Auth user wasn't created via Admin SDK.
  // The primary action here is deleting from Firestore.
  const userToDeleteDocRef = doc(db, "users", input.targetUserUid); 

  try {
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data()?.status !== "pending") {
      return { success: false, message: "Deletion request not found or already processed." };
    }

    // Attempt to delete user from Firestore 'users' collection
    const userToDeleteSnap = await getDoc(userToDeleteDocRef);
    if (userToDeleteSnap.exists()) {
        await deleteDoc(userToDeleteDocRef);
    } else {
        console.warn(`User document ${input.targetUserUid} not found in Firestore during deletion approval. Proceeding with request update.`);
    }
    // IMPORTANT NOTE: Deleting from Firebase Authentication (targetUserUid)
    // requires Admin SDK and should be done in a Cloud Function for security.
    // This action only removes the Firestore record.

    await updateDoc(requestDocRef, {
      status: "approved",
      processedByUid: managerUser.uid,
      processedByName: managerUser.name || "Manager/Dev",
      processedTimestamp: serverTimestamp() as Timestamp,
    });

    await sendNotificationAction({
      senderId: managerUser.uid,
      senderName: managerUser.name || "System (Approval)",
      senderRole: managerUser.role,
      title: "Deletion Request Approved",
      message: `Your request to delete staff ${input.targetUserName} (ID: ${input.targetStaffId}) has been approved. The user has been removed from Firestore.`,
    });
    
     await sendNotificationAction({
      senderId: managerUser.uid,
      senderName: "System Announcement",
      senderRole: "system",
      title: "Staff Member Removed",
      message: `Staff member ${input.targetUserName} (ID: ${input.targetStaffId}) has been removed from the system (Firestore record).`,
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
  targetStaffId?: string,
  targetUserName?: string,
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

    if(targetUserName && targetStaffId && requestingSupervisorName){
        await sendNotificationAction({
            senderId: managerUser.uid,
            senderName: managerUser.name || "System (Approval)",
            senderRole: managerUser.role,
            title: "Deletion Request Declined",
            message: `Your request to delete staff ${targetUserName} (ID: ${targetStaffId}) has been declined by ${managerUser.name || 'management'}. Feedback: ${feedback || 'N/A'}`,
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


// --- Actions for Add Staff Requests ---

export async function approveAddStaffRequestAction(
  request: AddStaffRequestData, // Pass the full request object
  managerUser: { uid: string; name?: string; role: string }
): Promise<{ success: boolean; message: string }> {
  if (managerUser.role !== "manager" && managerUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can approve add staff requests." };
  }
  if (!request.id) {
     return { success: false, message: "Request ID missing." };
  }

  const requestDocRef = doc(db, "addStaffRequests", request.id);

  try {
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data()?.status !== "pending") {
      return { success: false, message: "Add staff request not found or already processed." };
    }

    // Call addUserAction to create the user in Firestore (and simulate Auth)
    const addUserResult = await addUserAction({
      name: request.targetUserName,
      staffId: request.targetStaffId,
      role: request.targetUserRole,
      initialPassword: request.initialPassword || "password",
    }, managerUser);

    if (!addUserResult.success) {
      return { success: false, message: `Failed to add user: ${addUserResult.message}` };
    }

    await updateDoc(requestDocRef, {
      status: "approved",
      processedByUid: managerUser.uid,
      processedByName: managerUser.name || "Manager/Dev",
      processedTimestamp: serverTimestamp() as Timestamp,
    });

    await sendNotificationAction({
      senderId: managerUser.uid,
      senderName: managerUser.name || "System (Approval)",
      senderRole: managerUser.role,
      title: "Add Staff Request Approved",
      message: `Your request to add staff ${request.targetUserName} (ID: ${request.targetStaffId}) has been approved. The user has been added.`,
    });

    revalidatePath("/app-dashboard/staff-management");
    revalidatePath("/app-dashboard/approval-requests");
    revalidatePath("/app-dashboard/notifications");
    return { success: true, message: "Add staff request approved and user added." };
  } catch (error: any) {
    console.error("Error approving add staff request:", error);
    return { success: false, message: error.message || "Failed to approve add staff request." };
  }
}

export async function declineAddStaffRequestAction(
  requestId: string,
  managerUser: { uid: string; name?: string; role: string },
  feedback?: string,
  targetStaffId?: string,
  targetUserName?: string,
  requestingSupervisorName?: string,
): Promise<{ success: boolean; message: string }> {
  if (managerUser.role !== "manager" && managerUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can decline add staff requests." };
  }

  const requestDocRef = doc(db, "addStaffRequests", requestId);
  try {
    const requestSnap = await getDoc(requestDocRef);
    if (!requestSnap.exists() || requestSnap.data()?.status !== "pending") {
      return { success: false, message: "Add staff request not found or already processed." };
    }

    await updateDoc(requestDocRef, {
      status: "declined",
      processedByUid: managerUser.uid,
      processedByName: managerUser.name || "Manager/Dev",
      processedTimestamp: serverTimestamp() as Timestamp,
      managerFeedback: feedback || "",
    });

    if(targetUserName && targetStaffId && requestingSupervisorName){
        await sendNotificationAction({
            senderId: managerUser.uid,
            senderName: managerUser.name || "System (Approval)",
            senderRole: managerUser.role,
            title: "Add Staff Request Declined",
            message: `Your request to add staff ${targetUserName} (ID: ${targetStaffId}) has been declined by ${managerUser.name || 'management'}. Feedback: ${feedback || 'N/A'}`,
        });
    }

    revalidatePath("/app-dashboard/approval-requests");
    revalidatePath("/app-dashboard/notifications");
    return { success: true, message: "Add staff request declined." };
  } catch (error: any) {
    console.error("Error declining add staff request:", error);
    return { success: false, message: error.message || "Failed to decline add staff request." };
  }
}

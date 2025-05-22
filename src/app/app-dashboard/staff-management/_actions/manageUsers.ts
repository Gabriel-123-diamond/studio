
"use server";

import { db } from "@/lib/firebase"; // auth removed as it's not used on server for these actions
import { collection, doc, setDoc, deleteDoc, getDoc, serverTimestamp, Timestamp, query, where, getDocs } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { UserData } from "@/types/users";
import type { DeletionRequestData, AddStaffRequestData } from "@/types/requests"; // Added AddStaffRequestData
import { sendNotificationAction } from "../../notifications/_actions/sendNotification";

interface AddUserInput {
  name: string;
  staffId: string; // 6 digits
  role: UserData["role"];
  initialPassword?: string; // Optional, defaults to "password"
}

export async function addUserAction(
  input: AddUserInput,
  actingUser: { uid: string; name?: string; role: string }
): Promise<{ success: boolean; message: string; newUserId?: string }> {
  if (actingUser.role !== "manager" && actingUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can add users directly." };
  }
   if (actingUser.role === "manager" && (input.role === "developer" || input.role === "manager")) {
    return { success: false, message: "Managers cannot assign 'developer' or 'manager' roles." };
  }


  if (!/^\d{6}$/.test(input.staffId)) {
    return { success: false, message: "Staff ID must be exactly 6 digits." };
  }
  if (!input.name.trim()) {
    return { success: false, message: "Name cannot be empty." };
  }
  if (!input.role || input.role === "none") {
    return { success: false, message: "A valid role must be selected." };
  }
  
  // Check if staffId already exists
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("staffId", "==", input.staffId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { success: false, message: `Staff ID ${input.staffId} is already in use.` };
  }


  const email = `${input.staffId}@mealvilla.com`;
  // IMPORTANT: Firebase Auth user creation should ideally happen in a secure backend (e.g., Cloud Function)
  // using the Admin SDK, especially when one user creates another.
  // For this example, we'll simulate it by creating a placeholder UID if not running in an environment
  // where client-side Auth creation would work (which it won't from a Server Action directly).
  const newUserId = `firestore_generated_uid_${Date.now()}`; // This is a placeholder. Real Auth UID is needed.
  console.warn(`SIMULATION: User Auth creation for ${email} is not performed by this server action. 
    This action only creates the Firestore record. Real Firebase Auth user creation is required separately (e.g., via Admin SDK or Firebase Console). 
    Using placeholder UID: ${newUserId}`);

  try {
    const newUserDocRef = doc(db, "users", newUserId);
    const newUserFirestoreData: UserData = {
      id: newUserId, // In a real scenario, this would be the Firebase Auth UID
      staffId: input.staffId,
      name: input.name,
      email: email,
      role: input.role,
    };
    await setDoc(newUserDocRef, newUserFirestoreData);

    revalidatePath("/app-dashboard/staff-management");
    return {
      success: true,
      message: `User ${input.name} (ID: ${input.staffId}) added to Firestore successfully. (Auth creation simulated).`,
      newUserId: newUserId,
    };
  } catch (error: any) {
    console.error("Error adding user to Firestore:", error);
    return { success: false, message: error.message || "Failed to add user to Firestore." };
  }
}

export async function deleteUserFirestoreAction(
  targetUserId: string,
  actingUser: { uid: string; name?: string; role: string }
): Promise<{ success: boolean; message: string }> {
  if (actingUser.role !== "manager" && actingUser.role !== "developer") {
    return { success: false, message: "Permission denied: Only managers or developers can delete users." };
  }

  try {
    const userDocRef = doc(db, "users", targetUserId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "User not found in Firestore." };
    }
    
    const targetUserData = userDocSnap.data() as UserData;
    if (actingUser.role === "manager" && (targetUserData.role === "manager" || targetUserData.role === "developer") && actingUser.uid !== targetUserId) {
         return { success: false, message: "Managers cannot delete other managers or developers." };
    }

    await deleteDoc(userDocRef);
    // Note: Firebase Auth user deletion requires Admin SDK and is not handled here.
    // This action only removes the Firestore record.

    revalidatePath("/app-dashboard/staff-management");
    return {
      success: true,
      message: `User successfully deleted from Firestore. Firebase Auth record may still exist and require manual or backend deletion.`,
    };
  } catch (error: any) {
    console.error("Error deleting user from Firestore:", error);
    return { success: false, message: error.message || "Failed to delete user from Firestore." };
  }
}

interface RequestUserDeletionInput {
  targetUserUid: string;
  targetStaffId: string;
  targetUserName: string;
  targetUserRole: UserData["role"];
  reasonForRequest?: string;
}

export async function requestUserDeletionAction(
  input: RequestUserDeletionInput,
  supervisorUser: { uid: string; name: string; role: string }
): Promise<{ success: boolean; message: string; requestId?: string }> {
  if (supervisorUser.role !== "supervisor") {
    return { success: false, message: "Permission denied: Only supervisors can request deletions." };
  }
  if (input.targetUserRole === "manager" || input.targetUserRole === "developer" || input.targetUserRole === "supervisor") {
    return { success: false, message: "Supervisors cannot request deletion of managers, developers, or other supervisors." };
  }

  try {
    const requestDocRef = doc(collection(db, "deletionRequests"));
    const newRequest: DeletionRequestData = {
      id: requestDocRef.id,
      requestedByUid: supervisorUser.uid,
      requestedByName: supervisorUser.name || "Supervisor",
      requestedByRole: supervisorUser.role,
      targetUserUid: input.targetUserUid,
      targetStaffId: input.targetStaffId,
      targetUserName: input.targetUserName || `User (ID: ${input.targetStaffId || 'N/A'})`, // Fallback if name is undefined
      targetUserRole: input.targetUserRole,
      status: "pending",
      requestTimestamp: serverTimestamp() as Timestamp,
      reasonForRequest: input.reasonForRequest || "",
    };
    await setDoc(requestDocRef, newRequest);

    // Ensure targetUserName is defined for the notification
    const notificationTargetUserName = newRequest.targetUserName;

    await sendNotificationAction({
        senderId: supervisorUser.uid,
        senderName: supervisorUser.name || "System (Deletion Request)",
        senderRole: supervisorUser.role,
        title: "New Staff Deletion Request",
        message: `A request to delete staff ${notificationTargetUserName} (ID: ${input.targetStaffId}) has been submitted by ${supervisorUser.name}. Please review in Approval Requests.`,
    });

    revalidatePath("/app-dashboard/staff-management");
    revalidatePath("/app-dashboard/approval-requests");
    return {
      success: true,
      message: "Deletion request submitted successfully. It is now pending manager approval.",
      requestId: requestDocRef.id,
    };
  } catch (error: any) {
    console.error("Error submitting deletion request:", error);
    return { success: false, message: error.message || "Failed to submit deletion request." };
  }
}


interface RequestAddUserInput extends AddUserInput { // Re-use AddUserInput for structure
  reasonForRequest?: string;
}
export async function requestAddUserAction(
  input: RequestAddUserInput,
  supervisorUser: { uid: string; name: string; role: string }
): Promise<{ success: boolean; message: string; requestId?: string }> {
  if (supervisorUser.role !== "supervisor") {
    return { success: false, message: "Permission denied: Only supervisors can request to add users." };
  }
  if (input.role === "manager" || input.role === "developer") {
    return { success: false, message: "Supervisors cannot request to add 'manager' or 'developer' roles." };
  }
   if (!/^\d{6}$/.test(input.staffId)) {
    return { success: false, message: "Staff ID must be exactly 6 digits." };
  }
  if (!input.name.trim()) {
    // This should be caught by client-side Zod validation, but good to have a server check
    return { success: false, message: "Name cannot be empty." };
  }
  if (!input.role || input.role === "none") {
    return { success: false, message: "A valid role must be selected." };
  }

  // Check if staffId already exists
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("staffId", "==", input.staffId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { success: false, message: `Staff ID ${input.staffId} is already in use by an existing user.` };
  }


  try {
    const requestDocRef = doc(collection(db, "addStaffRequests"));
    const newAddRequest: AddStaffRequestData = {
      id: requestDocRef.id,
      requestedByUid: supervisorUser.uid,
      requestedByName: supervisorUser.name || "Supervisor",
      requestedByRole: supervisorUser.role,
      targetUserName: input.name, // Name is guaranteed by Zod on client, and checked above.
      targetStaffId: input.staffId,
      targetUserRole: input.role,
      initialPassword: input.initialPassword || "password", // Default if not provided
      status: "pending",
      requestTimestamp: serverTimestamp() as Timestamp,
      reasonForRequest: input.reasonForRequest || "",
    };
    await setDoc(requestDocRef, newAddRequest);

    await sendNotificationAction({
        senderId: supervisorUser.uid,
        senderName: supervisorUser.name || "System (Add Staff Request)",
        senderRole: supervisorUser.role,
        title: "New Add Staff Request",
        message: `A request to add staff ${input.name} (ID: ${input.staffId}, Role: ${input.role}) has been submitted by ${supervisorUser.name}. Please review in Approval Requests.`,
    });

    revalidatePath("/app-dashboard/staff-management");
    revalidatePath("/app-dashboard/approval-requests");
    return {
      success: true,
      message: "Request to add staff submitted successfully. It is now pending manager approval.",
      requestId: requestDocRef.id,
    };
  } catch (error: any) {
    console.error("Error submitting add staff request:", error);
    return { success: false, message: error.message || "Failed to submit add staff request." };
  }
}



"use server";

import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { UserData } from "@/types/users";
import type { DeletionRequestData } from "@/types/requests";
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
    return { success: false, message: "Permission denied: Only managers or developers can add users." };
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

  const email = `${input.staffId}@mealvilla.com`;
  const password = input.initialPassword || "password"; // Default password

  try {
    // Step 1: Create user in Firebase Authentication
    // IMPORTANT: Firebase Auth operations like createUserWithEmailAndPassword
    // are typically done on the client or in a trusted server environment (like Cloud Functions).
    // For this server action, we'll assume it has the necessary context IF it were a backend function.
    // In a real Next.js app, you'd typically have a client-side flow for this or use Admin SDK in a backend.
    // This will LIKELY FAIL if called directly from a Server Action without Admin SDK / special setup.
    // For now, this is a placeholder for the ideal flow.
    // A more realistic approach without Admin SDK is to manage users via Firebase Console or a dedicated admin panel with Admin SDK.

    // Let's simulate admin creation - in a real app, this part MUST use Admin SDK.
    // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // const newUserId = userCredential.user.uid;
    // For now, we'll skip Auth creation here and assume it's done manually or via another process,
    // focusing on Firestore record creation. This is a major simplification due to Server Action limitations.

    const newUserId = `simulated_uid_${Date.now()}`; // Placeholder
    console.warn(`SIMULATION: User Auth creation skipped for ${email}. Real app needs Admin SDK.`);


    // Step 2: Create user document in Firestore
    const newUserDocRef = doc(db, "users", newUserId); // Use the newUserId from Auth
    const newUserFirestoreData: UserData = {
      id: newUserId,
      staffId: input.staffId,
      name: input.name,
      email: email,
      role: input.role,
    };
    await setDoc(newUserDocRef, newUserFirestoreData);

    revalidatePath("/app-dashboard/staff-management");
    return {
      success: true,
      message: `User ${input.name} (${input.staffId}) added to Firestore successfully. (Auth creation simulated).`,
      newUserId: newUserId,
    };
  } catch (error: any) {
    console.error("Error adding user:", error);
    let message = "Failed to add user.";
    if (error.code === "auth/email-already-in-use") {
      message = "This Staff ID (email) is already in use.";
    } else if (error.code === "auth/weak-password") {
      message = "The password is too weak.";
    }
    return { success: false, message: message || error.message };
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
    
    // Add target user's role check to prevent manager deleting another manager/dev
    const targetUserData = userDocSnap.data() as UserData;
    if (actingUser.role === "manager" && (targetUserData.role === "manager" || targetUserData.role === "developer") && actingUser.uid !== targetUserId) {
         return { success: false, message: "Managers cannot delete other managers or developers." };
    }


    await deleteDoc(userDocRef);

    // IMPORTANT NOTE: Deleting from Firebase Authentication
    // To fully delete a user, you also need to delete them from Firebase Authentication.
    // This CANNOT be done reliably or securely from a client-side initiated server action
    // for *other users*. It requires the Firebase Admin SDK, typically run in a
    // Firebase Cloud Function or a secure backend server.
    // Example (conceptual, requires Admin SDK setup):
    // import { getAuth as getAdminAuth } from 'firebase-admin/auth';
    // await getAdminAuth().deleteUser(targetUserId);

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
      targetUserName: input.targetUserName,
      targetUserRole: input.targetUserRole,
      status: "pending",
      requestTimestamp: serverTimestamp() as Timestamp,
      reasonForRequest: input.reasonForRequest || "",
    };

    await setDoc(requestDocRef, newRequest);

    // Send notification to managers
    await sendNotificationAction({
        senderId: supervisorUser.uid,
        senderName: supervisorUser.name || "System (Deletion Request)",
        senderRole: supervisorUser.role,
        title: "New Staff Deletion Request",
        message: `A request to delete staff ${input.targetUserName} (ID: ${input.targetStaffId}) has been submitted by ${supervisorUser.name}. Please review in Approval Requests.`,
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

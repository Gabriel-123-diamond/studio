
"use server";

import { db } from "@/lib/firebase";
import type { NotificationData } from "@/types/notifications";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface SendNotificationInput {
  senderId: string;
  senderName?: string;
  senderRole: string;
  title: string;
  message: string;
}

export async function sendNotificationAction(
  data: SendNotificationInput
): Promise<{ success: boolean; message: string; notificationId?: string }> {
  if (!data.senderId || !data.senderRole || !data.title || !data.message) {
    return { success: false, message: "Missing required notification fields." };
  }

  try {
    const notificationPayload: Omit<NotificationData, "id" | "timestamp"> & { timestamp: Timestamp } = {
      senderId: data.senderId,
      senderName: data.senderName || "System",
      senderRole: data.senderRole,
      title: data.title,
      message: data.message,
      timestamp: serverTimestamp() as Timestamp, // Will be converted to server timestamp by Firestore
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationPayload);
    
    revalidatePath("/app-dashboard/notifications"); // Revalidate to show new notification
    
    return {
      success: true,
      message: "Notification sent successfully.",
      notificationId: docRef.id,
    };
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      message: error.message || "Failed to send notification. Please try again.",
    };
  }
}


import type { Timestamp } from "firebase/firestore";

export interface NotificationData {
  id?: string; // Firestore document ID
  senderId: string;
  senderName?: string; // Optional: denormalize for easier display
  senderRole: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  // targetRole?: "all" | "staff" | "supervisor" | "manager"; // For future targeted notifications
  // readBy?: string[]; // For future read status tracking
}

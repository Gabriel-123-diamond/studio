
import type { Timestamp } from "firebase/firestore";
import type { UserData } from "./users"; // Assuming UserData is in users.ts

export type RequestStatus = "pending" | "approved" | "declined";

export interface DeletionRequestData {
  id?: string; // Firestore document ID
  requestedByUid: string;
  requestedByName: string; // Denormalized for easy display
  requestedByRole: string;
  targetUserUid: string;
  targetStaffId: string;
  targetUserName: string; // Denormalized
  targetUserRole: string; // Denormalized
  status: RequestStatus;
  requestTimestamp: Timestamp;
  processedByUid?: string; // Manager/Developer who processed it
  processedByName?: string;
  processedTimestamp?: Timestamp;
  reasonForRequest?: string; // Optional
  managerFeedback?: string; // Optional
}

export interface AddStaffRequestData {
  id?: string; // Firestore document ID
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: string;
  // Details of the user to be added
  targetUserName: string;
  targetStaffId: string;
  targetUserRole: UserData["role"]; 
  initialPassword?: string; // Optional, for manager to set if approved
  status: RequestStatus;
  requestTimestamp: Timestamp;
  reasonForRequest?: string; // Optional justification from supervisor
  // For processing by manager
  processedByUid?: string;
  processedByName?: string;
  processedTimestamp?: Timestamp;
  managerFeedback?: string;
}

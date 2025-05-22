
export interface UserData {
  id: string; // Firebase Auth UID also used as Firestore document ID
  staffId: string;
  name: string;
  email: string;
  role: "manager" | "supervisor" | "staff" | "developer" | "none";
  // Add other relevant fields like department, dateJoined, etc. later
}

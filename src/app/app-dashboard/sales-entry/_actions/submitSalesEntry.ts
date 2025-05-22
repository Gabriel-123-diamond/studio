
"use server";

import { db } from "@/lib/firebase"; // auth removed as auth.currentUser is not reliable here
import type { SalesEntryData } from "@/types/sales";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function submitSalesEntry(
  data: Omit<SalesEntryData, "userId" | "staffId" | "date" | "isFinalized">,
  userId: string, // Added userId parameter
  currentStaffId: string
): Promise<{ success: boolean; message: string; entryId?: string }> {

  if (!userId) { // Check passed userId
    return { success: false, message: "User ID not provided." };
  }
  if (!currentStaffId) {
    return { success: false, message: "Staff ID not available." };
  }

  const today = new Date();
  const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const entryId = `${userId}_${dateString}`; // Use passed userId
  const salesEntryRef = doc(db, "salesEntries", entryId);

  try {
    const fullData: SalesEntryData = {
      ...data,
      userId: userId, // Use passed userId
      staffId: currentStaffId,
      date: dateString,
      isFinalized: false, 
    };

    await setDoc(salesEntryRef, fullData, { merge: true }); 

    revalidatePath("/app-dashboard/sales-entry"); 
    return { success: true, message: "Sales entry saved successfully.", entryId };
  } catch (error) {
    console.error("Error saving sales entry:", error);
    return { success: false, message: "Failed to save sales entry. Please try again." };
  }
}

export async function getTodaysSalesEntry(userId: string): Promise<SalesEntryData | null> { // Added userId parameter
  if (!userId) { // Check passed userId
    console.log("No user ID provided for getTodaysSalesEntry");
    return null;
  }

  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  const entryId = `${userId}_${dateString}`; // Use passed userId
  const salesEntryRef = doc(db, "salesEntries", entryId);

  try {
    const docSnap = await getDoc(salesEntryRef);
    if (docSnap.exists()) {
      return docSnap.data() as SalesEntryData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching today's sales entry:", error);
    return null;
  }
}

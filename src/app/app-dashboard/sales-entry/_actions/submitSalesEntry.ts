
"use server";

import { db } from "@/lib/firebase"; 
import type { SalesEntryData } from "@/types/sales";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Helper function to get the current date string (YYYY-MM-DD) in WAT (UTC+1)
function getTodayDateStringInWAT(): string {
  const now = new Date();
  // WAT is UTC+1. We'll calculate the time in WAT by adding 1 hour to the current UTC time.
  const watTime = now.getTime() + (1 * 60 * 60 * 1000); // Add 1 hour in milliseconds
  const watDate = new Date(watTime);

  // Format this date as YYYY-MM-DD using UTC methods,
  // because watDate is now effectively "in WAT" from a UTC perspective for date components.
  const year = watDate.getUTCFullYear();
  const month = (watDate.getUTCMonth() + 1).toString().padStart(2, '0'); // getUTCMonth is 0-indexed
  const day = watDate.getUTCDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export async function submitSalesEntry(
  data: Omit<SalesEntryData, "userId" | "staffId" | "date" | "isFinalized">,
  userId: string, 
  currentStaffId: string
): Promise<{ success: boolean; message: string; entryId?: string }> {

  if (!userId) { 
    return { success: false, message: "User ID not provided." };
  }
  if (!currentStaffId) {
    return { success: false, message: "Staff ID not available." };
  }

  const dateString = getTodayDateStringInWAT(); // Use WAT date

  const entryId = `${userId}_${dateString}`; 
  const salesEntryRef = doc(db, "salesEntries", entryId);

  try {
    const fullData: SalesEntryData = {
      ...data,
      userId: userId, 
      staffId: currentStaffId,
      date: dateString, // Store WAT date string
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

export async function getTodaysSalesEntry(userId: string): Promise<SalesEntryData | null> { 
  if (!userId) { 
    console.log("No user ID provided for getTodaysSalesEntry");
    return null;
  }

  const dateString = getTodayDateStringInWAT(); // Use WAT date
  const entryId = `${userId}_${dateString}`; 
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



"use server";

import { db } from "@/lib/firebase"; 
import type { SalesEntryData, ProductQuantities } from "@/types/sales";
import { initialProductQuantities } from "@/types/sales";
import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Helper function to get the current date string (YYYY-MM-DD) in WAT (UTC+1)
function getTodayDateStringInWAT(): string {
  const now = new Date();
  // WAT is UTC+1. Calculate time in WAT by adding 1 hour.
  const watTime = now.getTime() + (1 * 60 * 60 * 1000); 
  const watDate = new Date(watTime);

  const year = watDate.getUTCFullYear();
  const month = (watDate.getUTCMonth() + 1).toString().padStart(2, '0'); 
  const day = watDate.getUTCDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Helper to add quantities from 'added' to 'current'
function addProductQuantities(current: ProductQuantities, added: ProductQuantities): ProductQuantities {
  return {
    burger: (current.burger || 0) + (added.burger || 0),
    jumbo: (current.jumbo || 0) + (added.jumbo || 0),
    family: (current.family || 0) + (added.family || 0),
    short: (current.short || 0) + (added.short || 0),
  };
}

export async function submitSalesEntry(
  newData: Omit<SalesEntryData, "userId" | "staffId" | "date" | "isFinalized">,
  userId: string, 
  currentStaffId: string
): Promise<{ success: boolean; message: string; updatedData?: SalesEntryData }> {

  if (!userId) { 
    return { success: false, message: "User ID not provided." };
  }
  if (!currentStaffId) {
    return { success: false, message: "Staff ID not available." };
  }

  const dateString = getTodayDateStringInWAT(); 
  const entryId = `${userId}_${dateString}`; 
  const salesEntryRef = doc(db, "salesEntries", entryId);

  try {
    const finalData = await runTransaction(db, async (transaction) => {
      const existingDoc = await transaction.get(salesEntryRef);
      let currentData: SalesEntryData;

      if (!existingDoc.exists()) {
        // No existing entry, create a new one with the submitted data
        currentData = {
          ...newData, // collected, soldCash, etc. are from input
          userId: userId, 
          staffId: currentStaffId,
          date: dateString, 
          isFinalized: false, 
        };
      } else {
        // Existing entry found, add new quantities to existing ones
        const existingEntry = existingDoc.data() as SalesEntryData;
        if (existingEntry.isFinalized) {
          throw new Error("Today's sales data has been finalized and cannot be changed.");
        }
        currentData = {
          ...existingEntry, // Keep userId, staffId, date, isFinalized from existing
          collected: addProductQuantities(existingEntry.collected || initialProductQuantities, newData.collected || initialProductQuantities),
          soldCash: addProductQuantities(existingEntry.soldCash || initialProductQuantities, newData.soldCash || initialProductQuantities),
          soldTransfer: addProductQuantities(existingEntry.soldTransfer || initialProductQuantities, newData.soldTransfer || initialProductQuantities),
          soldCard: addProductQuantities(existingEntry.soldCard || initialProductQuantities, newData.soldCard || initialProductQuantities),
          returned: addProductQuantities(existingEntry.returned || initialProductQuantities, newData.returned || initialProductQuantities),
          damages: addProductQuantities(existingEntry.damages || initialProductQuantities, newData.damages || initialProductQuantities),
        };
      }
      transaction.set(salesEntryRef, currentData);
      return currentData; // Return the full, updated data
    });
    
    revalidatePath("/app-dashboard/sales-entry"); 
    return { success: true, message: "Sales entry updated successfully.", updatedData: finalData };
  } catch (error: any) {
    console.error("Error saving sales entry:", error);
    return { success: false, message: error.message || "Failed to save sales entry. Please try again." };
  }
}

export async function getTodaysSalesEntry(userId: string): Promise<SalesEntryData | null> { 
  if (!userId) { 
    console.log("No user ID provided for getTodaysSalesEntry");
    return null;
  }

  const dateString = getTodayDateStringInWAT(); 
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

    
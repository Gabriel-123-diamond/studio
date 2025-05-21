
"use server";

import { auth, db } from "@/lib/firebase";
import type { SalesEntryData } from "@/types/sales";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function submitSalesEntry(
  data: Omit<SalesEntryData, "userId" | "staffId" | "date" | "isFinalized">,
  currentStaffId: string
): Promise<{ success: boolean; message: string; entryId?: string }> {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }
  if (!currentStaffId) {
    return { success: false, message: "Staff ID not available." };
  }

  const today = new Date();
  const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const entryId = `${user.uid}_${dateString}`;
  const salesEntryRef = doc(db, "salesEntries", entryId);

  try {
    // Check if an entry for today already exists to decide if it's an update or new
    // For simplicity, this action always overwrites/creates.
    // More complex logic could be added here to prevent overwriting finalized entries by sales staff.

    const fullData: SalesEntryData = {
      ...data,
      userId: user.uid,
      staffId: currentStaffId,
      date: dateString,
      isFinalized: false, // Sales staff entries are initially not finalized
    };

    await setDoc(salesEntryRef, fullData, { merge: true }); // merge: true will update if exists, create if not

    revalidatePath("/app-dashboard/sales-entry"); // Revalidate the page to show updated data if needed
    return { success: true, message: "Sales entry saved successfully.", entryId };
  } catch (error) {
    console.error("Error saving sales entry:", error);
    return { success: false, message: "Failed to save sales entry. Please try again." };
  }
}

export async function getTodaysSalesEntry(): Promise<SalesEntryData | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user logged in for getTodaysSalesEntry");
    return null;
  }

  const today = new Date();
  const dateString = today.toISOString().split("T")[0];
  const entryId = `${user.uid}_${dateString}`;
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

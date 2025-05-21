
export interface ProductQuantities {
  burger: number;
  jumbo: number;
  family: number;
  short: number;
}

export const initialProductQuantities: ProductQuantities = {
  burger: 0,
  jumbo: 0,
  family: 0,
  short: 0,
};

export interface SalesEntryData {
  date: string; // YYYY-MM-DD
  userId: string;
  staffId: string;
  collected: ProductQuantities;
  soldCash: ProductQuantities;
  soldTransfer: ProductQuantities;
  soldCard: ProductQuantities;
  returned: ProductQuantities;
  damages: ProductQuantities;
  isFinalized?: boolean; // Default to false on creation
}

export const productTypes: Array<keyof ProductQuantities> = ["burger", "jumbo", "family", "short"];
export const productLabels: Record<keyof ProductQuantities, string> = {
  burger: "Burger",
  jumbo: "Jumbo",
  family: "Family",
  short: "Short",
};

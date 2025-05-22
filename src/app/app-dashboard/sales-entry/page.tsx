
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ClipboardPenLine, RotateCw, Save, Trash2 } from "lucide-react"; // Changed Eraser to Trash2 for reset
import type { SalesEntryData, ProductQuantities } from "@/types/sales";
import { initialProductQuantities, productTypes, productLabels } from "@/types/sales";
import { submitSalesEntry, getTodaysSalesEntry, resetTodaysSalesEntry } from "./_actions/submitSalesEntry"; // Added resetTodaysSalesEntry
import { Skeleton } from "@/components/ui/skeleton";
import type { User as FirebaseUser } from "firebase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const productQuantitySchema = z.object({
  burger: z.coerce.number().int().min(0).default(0),
  jumbo: z.coerce.number().int().min(0).default(0),
  family: z.coerce.number().int().min(0).default(0),
  short: z.coerce.number().int().min(0).default(0),
});

const salesEntryFormSchema = z.object({
  collected: productQuantitySchema,
  soldCash: productQuantitySchema,
  soldTransfer: productQuantitySchema,
  soldCard: productQuantitySchema,
  returned: productQuantitySchema,
  damages: productQuantitySchema,
});

type SalesEntryFormValues = z.infer<typeof salesEntryFormSchema>;

const defaultFormValues: SalesEntryFormValues = {
  collected: { ...initialProductQuantities },
  soldCash: { ...initialProductQuantities },
  soldTransfer: { ...initialProductQuantities },
  soldCard: { ...initialProductQuantities },
  returned: { ...initialProductQuantities },
  damages: { ...initialProductQuantities },
};

interface ProductQuantityInputGroupProps {
  control: any;
  namePrefix: keyof SalesEntryFormValues;
  title: string;
  isInputDisabled: boolean;
  isLoadingSavedValue: boolean;
  savedQuantities: ProductQuantities | undefined;
}

const ProductQuantityInputGroup: React.FC<ProductQuantityInputGroupProps> = ({ 
    control, 
    namePrefix, 
    title, 
    isInputDisabled, 
    isLoadingSavedValue, 
    savedQuantities 
}) => (
  <Card className="shadow-md rounded-lg">
    <CardHeader className="p-4 bg-muted/20 rounded-t-lg">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
      {productTypes.map((product) => (
        <div key={product} className="space-y-1.5">
          <Label htmlFor={`${namePrefix}.${product}`} className="text-sm font-medium text-foreground/80">
            {productLabels[product]}
          </Label>
          <Controller
            name={`${namePrefix}.${product}`}
            control={control}
            render={({ field }) => (
              <>
                <Input
                  {...field}
                  id={`${namePrefix}.${product}`}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rounded-md"
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  disabled={isInputDisabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingSavedValue ? (
                    "Loading quantity..."
                  ) : (
                    `Quantity: ${savedQuantities && savedQuantities[product] !== undefined ? savedQuantities[product] : 0}`
                  )}
                </p>
              </>
            )}
          />
        </div>
      ))}
    </CardContent>
  </Card>
);


export default function SalesEntryPage() {
  const { toast } = useToast();
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);
  const [isLoadingSalesEntry, setIsLoadingSalesEntry] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDataFinalized, setIsDataFinalized] = useState(false);
  const [todayDateDisplay, setTodayDateDisplay] = useState<string>("Loading date...");
  const [savedSalesData, setSavedSalesData] = useState<SalesEntryFormValues>(defaultFormValues);


  const form = useForm<SalesEntryFormValues>({
    resolver: zodResolver(salesEntryFormSchema),
    defaultValues: defaultFormValues, 
  });

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Lagos', 
    };
    setTodayDateDisplay(new Date().toLocaleDateString('en-US', options));
  }, []);


  const fetchCurrentUserDetails = useCallback(async (user: FirebaseUser) => {
    setIsLoadingUserDetails(true);
    setUserId(user.uid);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setStaffId(userDocSnap.data().staffId || null);
      } else {
        setStaffId(null);
        toast({ title: "Error", description: "Could not find your staff details in Firestore.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching staff ID:", error);
      setStaffId(null);
      toast({ title: "Error", description: "Failed to fetch staff details.", variant: "destructive" });
    }
    setIsLoadingUserDetails(false);
  }, [toast]);

  const loadTodaysData = useCallback(async (currentUserId: string, showToast = false) => {
    if (!currentUserId) {
      setIsLoadingSalesEntry(false);
      setSavedSalesData(defaultFormValues); 
      form.reset(defaultFormValues); 
      return;
    }
    setIsLoadingSalesEntry(true);
    const data = await getTodaysSalesEntry(currentUserId);
    if (data) {
      const currentData: SalesEntryFormValues = {
        collected: data.collected || initialProductQuantities,
        soldCash: data.soldCash || initialProductQuantities,
        soldTransfer: data.soldTransfer || initialProductQuantities,
        soldCard: data.soldCard || initialProductQuantities,
        returned: data.returned || initialProductQuantities,
        damages: data.damages || initialProductQuantities,
      };
      setSavedSalesData(currentData); 
      form.reset(defaultFormValues); // Input fields always start at 0 for additive entry
      setIsDataFinalized(data.isFinalized || false);
      if (showToast) {
        toast({ title: "Data Reloaded", description: "Today's sales totals have been loaded. Input fields cleared for new additions." });
      }
    } else {
      setSavedSalesData(defaultFormValues); 
      form.reset(defaultFormValues); 
      setIsDataFinalized(false);
      if (showToast) {
        toast({ title: "No Data Found", description: "No sales data found for today. Ready for new entry." });
      }
    }
    setIsLoadingSalesEntry(false);
  }, [form, toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        await fetchCurrentUserDetails(user);
      } else {
        setFirebaseUser(null);
        setUserId(null);
        setStaffId(null);
        setIsLoadingUserDetails(false);
        setIsLoadingSalesEntry(false); 
        setSavedSalesData(defaultFormValues);
        form.reset(defaultFormValues);
      }
    });
    return () => unsubscribe();
  }, [fetchCurrentUserDetails, form]);

  useEffect(() => {
    if (userId && !isLoadingUserDetails) { 
      loadTodaysData(userId);
    } else if (!userId) {
      setIsLoadingSalesEntry(false);
      setSavedSalesData(defaultFormValues);
      form.reset(defaultFormValues);
      setIsDataFinalized(false);
    }
  }, [userId, isLoadingUserDetails, loadTodaysData, form]);


  async function onSubmit(values: SalesEntryFormValues) {
    if (!staffId || !userId) {
      toast({ title: "Error", description: "User or Staff ID is not available. Cannot submit.", variant: "destructive" });
      return;
    }
    if (isDataFinalized) {
      toast({ title: "Data Finalized", description: "Today's sales data has been finalized and cannot be changed.", variant: "default" });
      return;
    }

    setIsSubmitting(true);
    const result = await submitSalesEntry(values, userId, staffId);
    if (result.success && result.updatedData) {
      toast({
        title: "Success!",
        description: result.message,
      });
      
      setSavedSalesData(result.updatedData as SalesEntryFormValues);
      form.reset(defaultFormValues); // Reset input fields to 0 for next additive entry
    } else {
      toast({
        title: "Submission Failed",
        description: result.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const handleResetTodaysData = async () => {
    if (!userId || !staffId) {
      toast({ title: "Error", description: "User or Staff ID not available. Cannot reset.", variant: "destructive" });
      return;
    }
    if (isDataFinalized) {
        toast({ title: "Data Finalized", description: "Cannot reset finalized data.", variant: "default" });
        return;
    }

    setIsResetting(true);
    const result = await resetTodaysSalesEntry(userId, staffId);
    if (result.success) {
      toast({ title: "Data Reset", description: result.message });
      setSavedSalesData(defaultFormValues);
      form.reset(defaultFormValues);
      setIsDataFinalized(false); // Data is no longer finalized after a reset
    } else {
      toast({ title: "Reset Failed", description: result.message, variant: "destructive" });
    }
    setIsResetting(false);
  };
  
  const isPageLoading = isLoadingUserDetails || (userId && isLoadingSalesEntry && !firebaseUser); 
  const isFormDisabled = isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || isDataFinalized || !userId || !staffId || isResetting;


  if (isPageLoading) { 
    return (
      <div className="w-full space-y-6">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-8 w-48 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-1/3 rounded" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Skeleton className="h-10 w-full rounded" /> <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-10 w-full rounded" /> <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-10 w-full rounded" /> <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-10 w-full rounded" /> <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                </div>
            ))}
          </CardContent>
           <CardFooter className="p-6 border-t flex justify-end">
            <Skeleton className="h-10 w-24 rounded-md mr-2" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md ml-2" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="shadow-xl rounded-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <ClipboardPenLine className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Daily Sales Entry</CardTitle>
              <CardDescription className="text-md">
                Enter sales data additions for {todayDateDisplay}. (Staff ID: {staffId || (isLoadingUserDetails ? "Loading..." : "N/A")})
              </CardDescription>
              <CardDescription className="text-sm mt-1">Values entered will be ADDED to today's existing totals. Input fields reset to 0 after saving.</CardDescription>
            </div>
          </div>
           {isDataFinalized && (
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
              <p className="font-semibold">Today's entry is finalized and cannot be modified or reset by sales staff.</p>
            </div>
          )}
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-8">
          {isLoadingUserDetails || (userId && isLoadingSalesEntry) ? ( 
            <div className="space-y-4">
                {[1,2,3].map(i => ( 
                    <div key={i} className="space-y-2 p-4 border rounded-lg shadow-sm">
                        <Skeleton className="h-6 w-1/3 mb-3 rounded" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1,2,3,4].map(j => <Skeleton key={j} className="h-16 w-full rounded" />)}
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <>
              <ProductQuantityInputGroup control={form.control} namePrefix="collected" title="Quantity Collected from Store (Enter new additions)" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.collected} 
              />
              <Separator />
              <Card className="shadow-md rounded-lg">
                  <CardHeader className="p-4 bg-muted/20 rounded-t-lg"><CardTitle className="text-xl">Quantity Sold (Enter new additions)</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-6">
                      <ProductQuantityInputGroup control={form.control} namePrefix="soldCash" title="Sold (Cash)" 
                        isInputDisabled={isFormDisabled} 
                        isLoadingSavedValue={isLoadingSalesEntry} 
                        savedQuantities={savedSalesData?.soldCash}
                      />
                      <ProductQuantityInputGroup control={form.control} namePrefix="soldTransfer" title="Sold (Transfer)" 
                        isInputDisabled={isFormDisabled} 
                        isLoadingSavedValue={isLoadingSalesEntry} 
                        savedQuantities={savedSalesData?.soldTransfer}
                      />
                      <ProductQuantityInputGroup control={form.control} namePrefix="soldCard" title="Sold (Card)" 
                        isInputDisabled={isFormDisabled} 
                        isLoadingSavedValue={isLoadingSalesEntry} 
                        savedQuantities={savedSalesData?.soldCard}
                      />
                  </CardContent>
              </Card>
              <Separator />
              <ProductQuantityInputGroup control={form.control} namePrefix="returned" title="Quantity Returned to Store (Enter new additions)" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.returned}
              />
              <Separator />
              <ProductQuantityInputGroup control={form.control} namePrefix="damages" title="Damages (Enter new additions)" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.damages}
              />
            </>
            )}
          </CardContent>
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-end items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || isDataFinalized || !userId || isResetting}
                  className="w-full sm:w-auto rounded-md"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {isResetting ? "Resetting..." : "Reset Today's Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will reset all sales data entered for today ({todayDateDisplay}) to zero in the database. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetTodaysData} className="bg-destructive hover:bg-destructive/90">
                    Yes, Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => userId && loadTodaysData(userId, true)}
              disabled={isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || !userId || isResetting}
              className="w-full sm:w-auto rounded-md"
            >
              <RotateCw className="mr-2 h-4 w-4" /> Reload Today's Totals
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Add to Today's Entry"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

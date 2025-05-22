
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
import { ClipboardPenLine, RotateCw, Save, Eraser } from "lucide-react";
import type { SalesEntryData } from "@/types/sales";
import { initialProductQuantities, productTypes, productLabels } from "@/types/sales";
import { submitSalesEntry, getTodaysSalesEntry } from "./_actions/submitSalesEntry";
import { Skeleton } from "@/components/ui/skeleton";
import type { User as FirebaseUser } from "firebase/auth";

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

const defaultValues: SalesEntryFormValues = {
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
          <Label htmlFor={`${namePrefix}.${product}`} className="text-sm font-medium">
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
                  className="rounded-md"
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  disabled={isInputDisabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingSavedValue ? (
                    "Loading saved..."
                  ) : (
                    `Saved: ${savedQuantities && savedQuantities[product] !== undefined ? savedQuantities[product] : 0}`
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDataFinalized, setIsDataFinalized] = useState(false);
  const [todayDateDisplay, setTodayDateDisplay] = useState<string>("Loading date...");
  const [savedSalesData, setSavedSalesData] = useState<SalesEntryFormValues | null>(null);


  const form = useForm<SalesEntryFormValues>({
    resolver: zodResolver(salesEntryFormSchema),
    defaultValues,
  });

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Lagos', // WAT timezone
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

  const loadTodaysData = useCallback(async (currentUserId: string) => {
    if (!currentUserId) {
      setIsLoadingSalesEntry(false);
      setSavedSalesData(defaultValues); // Ensure saved data is reset if no user
      form.reset(defaultValues);
      return;
    }
    setIsLoadingSalesEntry(true);
    const data = await getTodaysSalesEntry(currentUserId);
    if (data) {
      form.reset({
        collected: data.collected,
        soldCash: data.soldCash,
        soldTransfer: data.soldTransfer,
        soldCard: data.soldCard,
        returned: data.returned,
        damages: data.damages,
      });
      setSavedSalesData(data as SalesEntryFormValues); // Cast as full form values for consistency
      setIsDataFinalized(data.isFinalized || false);
    } else {
      form.reset(defaultValues);
      setSavedSalesData(defaultValues);
      setIsDataFinalized(false);
    }
    setIsLoadingSalesEntry(false);
  }, [form]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        await fetchCurrentUserDetails(user);
        // loadTodaysData will be called by the userId effect
      } else {
        setFirebaseUser(null);
        setUserId(null);
        setStaffId(null);
        setIsLoadingUserDetails(false);
        setIsLoadingSalesEntry(false); 
        setSavedSalesData(defaultValues);
        form.reset(defaultValues);
      }
    });
    return () => unsubscribe();
  }, [fetchCurrentUserDetails, form]);

  useEffect(() => {
    if (userId) {
      loadTodaysData(userId);
    } else {
      // If no userId (e.g., logged out), reset everything
      setIsLoadingSalesEntry(false);
      setSavedSalesData(defaultValues);
      form.reset(defaultValues);
      setIsDataFinalized(false);
    }
  }, [userId, loadTodaysData, form]);


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
    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
      setSavedSalesData(values); // Update saved data display on successful save
    } else {
      toast({
        title: "Submission Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  const handleResetForm = () => {
    form.reset(defaultValues);
    setSavedSalesData(defaultValues); // Also reset the "Saved: X" display to zeros
    toast({ title: "Form Reset", description: "All fields have been cleared to zero."});
  };
  
  const isPageLoading = isLoadingUserDetails || (userId && isLoadingSalesEntry && !savedSalesData);
  const isFormDisabled = isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || isDataFinalized || !userId || !staffId;


  if (isLoadingUserDetails && !userId && firebaseUser === null) { 
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
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                    </div>
                </div>
            ))}
          </CardContent>
           <CardFooter className="p-6 border-t flex justify-end">
            <Skeleton className="h-10 w-24 rounded-md mr-2" />
            <Skeleton className="h-10 w-24 rounded-md" />
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
                Enter sales data for {todayDateDisplay}. (Staff ID: {staffId || (isLoadingUserDetails ? "Loading..." : "N/A")})
              </CardDescription>
            </div>
          </div>
           {isDataFinalized && (
            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
              <p className="font-semibold">Today's entry is finalized and cannot be modified by sales staff.</p>
            </div>
          )}
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-8">
          {isPageLoading && !savedSalesData ? ( 
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-6 w-1/3 rounded" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-10 w-full rounded" />
                            <Skeleton className="h-10 w-full rounded" />
                            <Skeleton className="h-10 w-full rounded" />
                            <Skeleton className="h-10 w-full rounded" />
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <>
              <ProductQuantityInputGroup control={form.control} namePrefix="collected" title="Quantity Collected from Store" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.collected} 
              />
              <Separator />
              <Card className="shadow-md rounded-lg">
                  <CardHeader className="p-4 bg-muted/20 rounded-t-lg"><CardTitle className="text-xl">Quantity Sold</CardTitle></CardHeader>
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
              <ProductQuantityInputGroup control={form.control} namePrefix="returned" title="Quantity Returned to Store" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.returned}
              />
              <Separator />
              <ProductQuantityInputGroup control={form.control} namePrefix="damages" title="Damages" 
                isInputDisabled={isFormDisabled} 
                isLoadingSavedValue={isLoadingSalesEntry} 
                savedQuantities={savedSalesData?.damages}
              />
            </>
            )}
          </CardContent>
          <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-end items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || isDataFinalized || !userId}
              className="w-full sm:w-auto rounded-md"
            >
              <Eraser className="mr-2 h-4 w-4" /> Reset Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => userId && loadTodaysData(userId)}
              disabled={isSubmitting || isLoadingUserDetails || isLoadingSalesEntry || !userId}
              className="w-full sm:w-auto rounded-md"
            >
              <RotateCw className="mr-2 h-4 w-4" /> Reload Today's Data
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


    
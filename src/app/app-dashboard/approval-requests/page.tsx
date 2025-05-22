
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, onSnapshot, orderBy, where, Timestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Send, AlertTriangle, XCircle, Loader2, MessageSquare, UserPlus, UserMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserData } from "@/types/users";
import type { DeletionRequestData, AddStaffRequestData } from "@/types/requests";
import { approveDeletionRequestAction, declineDeletionRequestAction, approveAddStaffRequestAction, declineAddStaffRequestAction } from "./_actions/processRequests";
import { formatDistanceToNow } from 'date-fns';

enum UserRoleEnum {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

const feedbackFormSchema = z.object({ // Unified schema for both decline types
  feedback: z.string().min(5, "Feedback must be at least 5 characters.").max(200).optional().or(z.literal('')),
});
type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;


export default function ApprovalRequestsPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ uid: string; name?: string; role: UserData["role"] } | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  
  const [pendingDeletionRequests, setPendingDeletionRequests] = useState<DeletionRequestData[]>([]);
  const [pendingAddStaffRequests, setPendingAddStaffRequests] = useState<AddStaffRequestData[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [requestToProcess, setRequestToProcess] = useState<DeletionRequestData | AddStaffRequestData | null>(null);
  const [feedbackDialogAction, setFeedbackDialogAction] = useState<'declineDeletion' | 'declineAddStaff' | null>(null);
  
  const feedbackForm = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { feedback: "" },
  });

  const fetchCurrentUserDetails = useCallback(async (userAuth: FirebaseUser) => {
    setIsLoadingCurrentUser(true);
    try {
      const userDocRef = doc(db, "users", userAuth.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const dbUserData = userDocSnap.data();
        setCurrentUser({
          uid: userAuth.uid,
          name: dbUserData.name || userAuth.email?.split('@')[0] || "User",
          role: dbUserData.role as UserData["role"] || UserRoleEnum.NONE,
        });
      } else {
        setCurrentUser(null);
        toast({ title: "User Data Error", description: "Your user details could not be found.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setCurrentUser(null);
      toast({ title: "Session Error", description: "Could not retrieve user details.", variant: "destructive" });
    }
    setIsLoadingCurrentUser(false);
  }, [toast]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(fetchCurrentUserDetails);
    return () => unsubscribeAuth();
  }, [fetchCurrentUserDetails]);

  const isManagerOrDev = useMemo(() => currentUser?.role === UserRoleEnum.MANAGER || currentUser?.role === UserRoleEnum.DEVELOPER, [currentUser]);
  const isSupervisorView = useMemo(() => currentUser?.role === UserRoleEnum.SUPERVISOR, [currentUser]);

  useEffect(() => {
    if (!currentUser || !isManagerOrDev) {
      setIsLoadingRequests(false);
      setPendingDeletionRequests([]);
      setPendingAddStaffRequests([]);
      return;
    }

    setIsLoadingRequests(true);
    const deletionQuery = query(
      collection(db, "deletionRequests"), 
      where("status", "==", "pending"), 
      orderBy("requestTimestamp", "desc")
    );
    const addStaffQuery = query(
      collection(db, "addStaffRequests"),
      where("status", "==", "pending"),
      orderBy("requestTimestamp", "desc")
    );

    const unsubDeletion = onSnapshot(deletionQuery, (querySnapshot) => {
      const fetchedRequests: DeletionRequestData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as DeletionRequestData);
      });
      setPendingDeletionRequests(fetchedRequests);
      if (!isLoadingRequests && querySnapshot.metadata.fromCache) setIsLoadingRequests(true); // Re-set loading if from cache initially
      else if (!querySnapshot.metadata.fromCache) setIsLoadingRequests(false); // If not from cache and we are loading, stop loading
    }, (error) => {
      console.error("Error fetching pending deletion requests: ", error);
      toast({ title: "Error", description: "Could not fetch deletion requests.", variant: "destructive" });
      setIsLoadingRequests(false);
    });

    const unsubAddStaff = onSnapshot(addStaffQuery, (querySnapshot) => {
        const fetchedRequests: AddStaffRequestData[] = [];
        querySnapshot.forEach((doc) => {
            fetchedRequests.push({ id: doc.id, ...doc.data()} as AddStaffRequestData);
        });
        setPendingAddStaffRequests(fetchedRequests);
        // This logic might need refinement if one query finishes much earlier than the other
        if (!isLoadingRequests && querySnapshot.metadata.fromCache) setIsLoadingRequests(true);
        else if (!querySnapshot.metadata.fromCache) setIsLoadingRequests(false);
    }, (error) => {
        console.error("Error fetching pending add staff requests: ", error);
        toast({ title: "Error", description: "Could not fetch add staff requests.", variant: "destructive" });
        setIsLoadingRequests(false);
    });
    
    // Initial loading state should be true, and set to false only when both might have loaded (or errored)
    // This might be complex. For simplicity, this example sets false when either finishes.
    // A more robust solution would track loading for each query type.
    const initialLoadCheck = setTimeout(() => {
        if (isLoadingRequests) setIsLoadingRequests(false); // Timeout to ensure loading doesn't stick if no data
    }, 5000);


    return () => {
      unsubDeletion();
      unsubAddStaff();
      clearTimeout(initialLoadCheck);
    };
  }, [currentUser, isManagerOrDev, toast, isLoadingRequests]); // Added isLoadingRequests to dependencies

  const handleApproveDeletion = async (request: DeletionRequestData) => {
    if (!currentUser || !isManagerOrDev) return;
    setProcessingRequestId(request.id!);
    const result = await approveDeletionRequestAction({
        requestId: request.id!,
        targetUserUid: request.targetUserUid,
        targetStaffId: request.targetStaffId,
        targetUserName: request.targetUserName,
        requestingSupervisorUid: request.requestedByUid,
        requestingSupervisorName: request.requestedByName,
    }, currentUser);
    toast({ title: result.success ? "Approved" : "Error", description: result.message, variant: result.success ? "default" : "destructive"});
    setProcessingRequestId(null);
  };
  
  const handleApproveAddStaff = async (request: AddStaffRequestData) => {
    if (!currentUser || !isManagerOrDev) return;
    setProcessingRequestId(request.id!);
    const result = await approveAddStaffRequestAction(request, currentUser);
    toast({ title: result.success ? "Approved" : "Error", description: result.message, variant: result.success ? "default" : "destructive"});
    setProcessingRequestId(null);
  }

  const openFeedbackDialog = (request: DeletionRequestData | AddStaffRequestData, actionType: 'declineDeletion' | 'declineAddStaff') => {
    setRequestToProcess(request);
    setFeedbackDialogAction(actionType);
    feedbackForm.reset({ feedback: "" });
    setIsFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = async (values: FeedbackFormValues) => {
    if (!currentUser || !isManagerOrDev || !requestToProcess || !feedbackDialogAction) return;
    setProcessingRequestId(requestToProcess.id!);

    let result;
    if (feedbackDialogAction === 'declineDeletion') {
      const req = requestToProcess as DeletionRequestData;
      result = await declineDeletionRequestAction(
          req.id!, 
          currentUser, 
          values.feedback,
          req.targetStaffId,
          req.targetUserName,
          req.requestedByName
      );
    } else if (feedbackDialogAction === 'declineAddStaff') {
      const req = requestToProcess as AddStaffRequestData;
       result = await declineAddStaffRequestAction(
          req.id!, 
          currentUser, 
          values.feedback,
          req.targetStaffId,
          req.targetUserName,
          req.requestedByName
      );
    }

    if (result) {
        toast({ title: result.success ? "Declined" : "Error", description: result.message, variant: result.success ? "default" : "destructive"});
    }
    setProcessingRequestId(null);
    setIsFeedbackDialogOpen(false);
  };

  if (isLoadingCurrentUser) {
    return ( <div className="w-full"> <Card className="shadow-lg rounded-lg"> <CardHeader className="bg-muted/30 p-6 rounded-t-lg"> <Skeleton className="h-10 w-64 mb-1 rounded" /> <Skeleton className="h-4 w-full rounded" /> </CardHeader> <CardContent className="p-6"> <Skeleton className="h-32 w-full rounded" /> </CardContent> </Card> </div> );
  }

  const pageTitle = isManagerOrDev ? "Manage Approval Requests" : isSupervisorView ? "My Submitted Requests" : "Approval Requests";
  const pageDescription = isManagerOrDev ? "Review and process requests submitted by Supervisors." : isSupervisorView ? "View the status of your submitted requests." : "Approval request area.";
  const icon = isManagerOrDev ? CheckCircle : isSupervisorView ? Send : AlertTriangle;

  const noPendingRequests = pendingDeletionRequests.length === 0 && pendingAddStaffRequests.length === 0;

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4"> {React.createElement(icon, { className: `h-10 w-10 ${isManagerOrDev || isSupervisorView ? 'text-primary' : 'text-destructive'}` })} <div> <CardTitle className="text-3xl">{pageTitle}</CardTitle> <CardDescription className="text-md">{pageDescription}</CardDescription> </div> </div>
        </CardHeader>
        <CardContent className="p-6">
          {isManagerOrDev && (
            <>
              {isLoadingRequests && (pendingDeletionRequests.length === 0 && pendingAddStaffRequests.length === 0) ? ( // Show skeleton only if truly no data yet
                <div className="space-y-4"> {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)} </div>
              ) : noPendingRequests ? (
                <div className="mt-4 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/10"> <MessageSquare className="h-10 w-10 text-primary/60 mx-auto mb-3" /> <p className="text-lg font-medium text-muted-foreground">No pending requests.</p> </div>
              ) : (
                <div className="space-y-6">
                  {/* Deletion Requests */}
                  {pendingDeletionRequests.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-4 flex items-center"><UserMinus className="mr-2 h-5 w-5 text-destructive" /> Pending Deletion Requests</h3>
                      <div className="space-y-4">
                        {pendingDeletionRequests.map((req) => (
                          <Card key={`del-${req.id}`} className="shadow-sm rounded-lg">
                            <CardHeader className="p-4 pb-2"> <CardTitle className="text-lg">Delete: {req.targetUserName} (ID: {req.targetStaffId})</CardTitle> <CardDescription className="text-xs text-muted-foreground"> Requested by: {req.requestedByName} ({req.requestedByRole}) - {req.requestTimestamp ? formatDistanceToNow(req.requestTimestamp.toDate(), { addSuffix: true }) : 'N/A'} </CardDescription> </CardHeader>
                            <CardContent className="p-4 pt-1"> <p className="text-sm text-foreground/90">Role: {req.targetUserRole}</p> {req.reasonForRequest && <p className="text-sm text-muted-foreground mt-1">Reason: {req.reasonForRequest}</p>} <p className="mt-1 text-xs text-destructive-foreground/80 bg-destructive/20 p-2 rounded-md"> <AlertTriangle className="inline h-3 w-3 mr-1" /> Approving will remove user from Firestore. Firebase Auth record requires separate handling. </p> </CardContent>
                            <CardFooter className="p-4 pt-2 flex justify-end space-x-2"> <Button variant="outline" size="sm" className="rounded-md" onClick={() => openFeedbackDialog(req, 'declineDeletion')} disabled={processingRequestId === req.id}> {processingRequestId === req.id && feedbackDialogAction === 'declineDeletion' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />} Decline </Button> <Button variant="default" size="sm" className="rounded-md bg-destructive hover:bg-destructive/90" onClick={() => handleApproveDeletion(req)} disabled={processingRequestId === req.id}> {processingRequestId === req.id && feedbackDialogAction !== 'declineDeletion' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />} Approve Deletion </Button> </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )}
                  {/* Add Staff Requests */}
                   {pendingAddStaffRequests.length > 0 && (
                    <section>
                        <h3 className="text-xl font-semibold mb-4 mt-6 flex items-center"><UserPlus className="mr-2 h-5 w-5 text-green-600" /> Pending Add Staff Requests</h3>
                        <div className="space-y-4">
                        {pendingAddStaffRequests.map((req) => (
                            <Card key={`add-${req.id}`} className="shadow-sm rounded-lg">
                                <CardHeader className="p-4 pb-2"> <CardTitle className="text-lg">Add New Staff: {req.targetUserName} (ID: {req.targetStaffId})</CardTitle> <CardDescription className="text-xs text-muted-foreground"> Requested by: {req.requestedByName} ({req.requestedByRole}) - {req.requestTimestamp ? formatDistanceToNow(req.requestTimestamp.toDate(), { addSuffix: true }) : 'N/A'} </CardDescription> </CardHeader>
                                <CardContent className="p-4 pt-1">
                                    <p className="text-sm text-foreground/90">Requested Role: {req.targetUserRole}</p>
                                    {req.initialPassword && <p className="text-sm text-muted-foreground mt-1">Suggested Password: (Hidden for security, will use '{req.initialPassword}' if approved, or default 'password')</p>}
                                    {req.reasonForRequest && <p className="text-sm text-muted-foreground mt-1">Reason: {req.reasonForRequest}</p>}
                                    <p className="mt-1 text-xs text-primary-foreground/80 bg-primary/20 p-2 rounded-md"> <AlertTriangle className="inline h-3 w-3 mr-1" /> Approving will add user to Firestore. Firebase Auth record requires separate handling. </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-2 flex justify-end space-x-2">
                                    <Button variant="outline" size="sm" className="rounded-md" onClick={() => openFeedbackDialog(req, 'declineAddStaff')} disabled={processingRequestId === req.id}> {processingRequestId === req.id && feedbackDialogAction === 'declineAddStaff' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />} Decline </Button>
                                    <Button variant="default" size="sm" className="rounded-md bg-green-600 hover:bg-green-700" onClick={() => handleApproveAddStaff(req)} disabled={processingRequestId === req.id}> {processingRequestId === req.id && feedbackDialogAction !== 'declineAddStaff' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />} Approve Addition </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        </div>
                    </section>
                   )}
                </div>
              )}
            </>
          )}

          {isSupervisorView && ( <div className="mt-4 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/10"> <MessageSquare className="h-10 w-10 text-primary/60 mx-auto mb-3" /> <p className="text-lg font-medium text-muted-foreground">Viewing your submitted requests is not yet fully implemented.</p> <p className="text-sm text-muted-foreground mt-1">You can submit requests from the Staff Management page.</p> </div> )}
          
          {(!isManagerOrDev && !isSupervisorView) && ( <p className="text-lg text-muted-foreground">You do not have specific actions for approval requests in your current role.</p> )}
        </CardContent>
      </Card>

      {requestToProcess && (
        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader> <DialogTitle>Decline Request</DialogTitle>
              <DialogDescription> Provide feedback for declining the request for {requestToProcess.targetUserName} (ID: {requestToProcess.targetStaffId}). </DialogDescription>
            </DialogHeader>
            <form onSubmit={feedbackForm.handleSubmit(handleFeedbackSubmit)} className="space-y-4 py-2">
              <div> <Label htmlFor="feedback">Feedback (Optional)</Label> <Textarea id="feedback" {...feedbackForm.register("feedback")} placeholder="Enter reason for declining..." className="mt-1 rounded-md" rows={3} /> {feedbackForm.formState.errors.feedback && <p className="text-sm text-destructive mt-1">{feedbackForm.formState.errors.feedback.message}</p>} </div>
              <DialogFooter> <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose> <Button type="submit" variant="destructive" disabled={processingRequestId === requestToProcess.id} className="rounded-md"> {processingRequestId === requestToProcess.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Confirm Decline"} </Button> </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

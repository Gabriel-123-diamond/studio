
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
import { CheckCircle, Send, AlertTriangle, XCircle, Loader2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserData } from "@/types/users";
import type { DeletionRequestData } from "@/types/requests";
import { approveDeletionRequestAction, declineDeletionRequestAction } from "./_actions/processRequests";
import { formatDistanceToNow } from 'date-fns';

enum UserRoleEnum {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

const declineFormSchema = z.object({
  feedback: z.string().min(5, "Feedback must be at least 5 characters.").max(200).optional(),
});
type DeclineFormValues = z.infer<typeof declineFormSchema>;


export default function ApprovalRequestsPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ uid: string; name?: string; role: UserData["role"] } | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  
  const [pendingRequests, setPendingRequests] = useState<DeletionRequestData[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [requestToDecline, setRequestToDecline] = useState<DeletionRequestData | null>(null);
  
  const declineForm = useForm<DeclineFormValues>({
    resolver: zodResolver(declineFormSchema),
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
    if (!currentUser || !isManagerOrDev) { // Only fetch for managers/devs
      setIsLoadingRequests(false);
      setPendingRequests([]);
      return;
    }

    setIsLoadingRequests(true);
    const q = query(
      collection(db, "deletionRequests"), 
      where("status", "==", "pending"), 
      orderBy("requestTimestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedRequests: DeletionRequestData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({ id: doc.id, ...doc.data() } as DeletionRequestData);
      });
      setPendingRequests(fetchedRequests);
      setIsLoadingRequests(false);
    }, (error) => {
      console.error("Error fetching pending requests: ", error);
      toast({ title: "Error", description: "Could not fetch pending requests.", variant: "destructive" });
      setIsLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [currentUser, isManagerOrDev, toast]);

  const handleApprove = async (request: DeletionRequestData) => {
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

  const openDeclineDialog = (request: DeletionRequestData) => {
    setRequestToDecline(request);
    declineForm.reset({ feedback: "" });
    setIsDeclineDialogOpen(true);
  };

  const handleDecline = async (values: DeclineFormValues) => {
    if (!currentUser || !isManagerOrDev || !requestToDecline) return;
    setProcessingRequestId(requestToDecline.id!);
    const result = await declineDeletionRequestAction(
        requestToDecline.id!, 
        currentUser, 
        values.feedback,
        requestToDecline.targetStaffId,
        requestToDecline.targetUserName,
        requestToDecline.requestedByUid,
        requestToDecline.requestedByName
    );
    toast({ title: result.success ? "Declined" : "Error", description: result.message, variant: result.success ? "default" : "destructive"});
    setProcessingRequestId(null);
    setIsDeclineDialogOpen(false);
  };


  if (isLoadingCurrentUser) {
    return (
      <div className="w-full">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="bg-muted/30 p-6 rounded-t-lg"> <Skeleton className="h-10 w-64 mb-1 rounded" /> <Skeleton className="h-4 w-full rounded" /> </CardHeader>
          <CardContent className="p-6"> <Skeleton className="h-32 w-full rounded" /> </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = isManagerOrDev ? "Manage Approval Requests" : isSupervisorView ? "My Submitted Requests" : "Approval Requests";
  const pageDescription = isManagerOrDev
    ? "Review and process staff deletion requests submitted by Supervisors."
    : isSupervisorView
    ? "View the status of your submitted requests for staff deletion or promotion."
    : "This section is for managing or submitting approval requests.";
  const icon = isManagerOrDev ? CheckCircle : isSupervisorView ? Send : AlertTriangle;


  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            {React.createElement(icon, { className: `h-10 w-10 ${isManagerOrDev || isSupervisorView ? 'text-primary' : 'text-destructive'}` })}
            <div>
              <CardTitle className="text-3xl">{pageTitle}</CardTitle>
              <CardDescription className="text-md">{pageDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isManagerOrDev && (
            <>
              <h3 className="text-xl font-semibold mb-4">Pending Deletion Requests</h3>
              {isLoadingRequests ? (
                <div className="space-y-4"> {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)} </div>
              ) : pendingRequests.length === 0 ? (
                <div className="mt-4 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/10">
                  <MessageSquare className="h-10 w-10 text-primary/60 mx-auto mb-3" />
                  <p className="text-lg font-medium text-muted-foreground">No pending deletion requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <Card key={req.id} className="shadow-sm rounded-lg">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg">Delete: {req.targetUserName} (ID: {req.targetStaffId})</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          Requested by: {req.requestedByName} ({req.requestedByRole}) - {req.requestTimestamp ? formatDistanceToNow(req.requestTimestamp.toDate(), { addSuffix: true }) : 'N/A'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-1">
                        <p className="text-sm text-foreground/90">Role: {req.targetUserRole}</p>
                        {req.reasonForRequest && <p className="text-sm text-muted-foreground mt-1">Reason: {req.reasonForRequest}</p>}
                         <p className="mt-1 text-xs text-destructive-foreground/80 bg-destructive/20 p-2 rounded-md">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Approving will remove user from Firestore. Firebase Auth record may require manual/backend deletion.
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-2 flex justify-end space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-md"
                            onClick={() => openDeclineDialog(req)}
                            disabled={processingRequestId === req.id}
                        >
                           {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />} Decline
                        </Button>
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="rounded-md bg-destructive hover:bg-destructive/90"
                            onClick={() => handleApprove(req)}
                            disabled={processingRequestId === req.id}
                        >
                           {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />} Approve Deletion
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {isSupervisorView && (
             <div className="mt-4 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/10">
                <MessageSquare className="h-10 w-10 text-primary/60 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">Viewing your submitted requests is not yet implemented.</p>
                <p className="text-sm text-muted-foreground mt-1">You can submit deletion requests from the Staff Management page.</p>
            </div>
          )}
          
          {(!isManagerOrDev && !isSupervisorView) && (
            <p className="text-lg text-muted-foreground">You do not have specific actions for approval requests in your current role. Contact an administrator if you believe this is an error.</p>
          )}
        </CardContent>
      </Card>

      {/* Decline Request Dialog */}
      {requestToDecline && (
        <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Decline Deletion Request</DialogTitle>
              <DialogDescription>
                Provide feedback for declining the request to delete {requestToDecline.targetUserName} (ID: {requestToDecline.targetStaffId}).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={declineForm.handleSubmit(handleDecline)} className="space-y-4 py-2">
              <div>
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea 
                    id="feedback" 
                    {...declineForm.register("feedback")} 
                    placeholder="Enter reason for declining..." 
                    className="mt-1 rounded-md"
                    rows={3}
                />
                 {declineForm.formState.errors.feedback && <p className="text-sm text-destructive mt-1">{declineForm.formState.errors.feedback.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose>
                <Button type="submit" variant="destructive" disabled={processingRequestId === requestToDecline.id} className="rounded-md">
                  {processingRequestId === requestToDecline.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Confirm Decline"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

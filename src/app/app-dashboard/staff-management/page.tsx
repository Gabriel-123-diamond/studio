
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, onSnapshot, orderBy } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCog, PlusCircle, Trash2, AlertTriangle, Eye, EyeOff, Send, Loader2, UserPlus } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import type { UserData } from "@/types/users";
import { addUserAction, deleteUserFirestoreAction, requestUserDeletionAction, requestAddUserAction } from "./_actions/manageUsers";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


enum UserRoleEnum {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer",
  STAFF = "staff",
  NONE = "none",
}

const userRoleOptions = [
  { value: UserRoleEnum.STAFF, label: "Staff" },
  { value: UserRoleEnum.SUPERVISOR, label: "Supervisor" },
  { value: UserRoleEnum.MANAGER, label: "Manager" },
  { value: UserRoleEnum.DEVELOPER, label: "Developer" },
];

const addUserFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  staffId: z.string().regex(/^\d{6}$/, "Staff ID must be exactly 6 digits."),
  role: z.enum([UserRoleEnum.STAFF, UserRoleEnum.SUPERVISOR, UserRoleEnum.MANAGER, UserRoleEnum.DEVELOPER]),
  initialPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;

const requestDeletionSchema = z.object({
  reasonForRequest: z.string().min(10, "Reason must be at least 10 characters.").max(200).optional().or(z.literal('')),
});
type RequestDeletionFormValues = z.infer<typeof requestDeletionSchema>;

// Schema for Supervisor requesting to add user
const requestAddUserFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  staffId: z.string().regex(/^\d{6}$/, "Staff ID must be exactly 6 digits."),
  role: z.enum([UserRoleEnum.STAFF, UserRoleEnum.SUPERVISOR]), // Supervisors can only request these roles
  initialPassword: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  reasonForRequest: z.string().max(200).optional().or(z.literal('')),
});
type RequestAddUserFormValues = z.infer<typeof requestAddUserFormSchema>;


export default function StaffManagementPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ uid: string; name?: string; role: UserData["role"] } | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  const [staffList, setStaffList] = useState<UserData[]>([]);
  const [isLoadingStaffList, setIsLoadingStaffList] = useState(true);
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isRequestAddUserDialogOpen, setIsRequestAddUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRequestDeleteDialogOpen, setIsRequestDeleteDialogOpen] = useState(false);
  const [userToRequestDelete, setUserToRequestDelete] = useState<UserData | null>(null);
  const [userToDeleteDirectly, setUserToDeleteDirectly] = useState<UserData | null>(null); // For manager direct delete confirmation


  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { name: "", staffId: "", role: UserRoleEnum.STAFF, initialPassword: "" },
  });

  const requestDeletionForm = useForm<RequestDeletionFormValues>({
    resolver: zodResolver(requestDeletionSchema),
    defaultValues: { reasonForRequest: "" },
  });

  const requestAddUserForm = useForm<RequestAddUserFormValues>({
    resolver: zodResolver(requestAddUserFormSchema),
    defaultValues: { name: "", staffId: "", role: UserRoleEnum.STAFF, initialPassword: "", reasonForRequest: "" },
  });


  const fetchCurrentUser = useCallback(async (userAuth: FirebaseUser) => {
    setIsLoadingCurrentUser(true);
    try {
      const userDocRef = doc(db, "users", userAuth.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setCurrentUser({
          uid: userAuth.uid,
          name: userData.name || userAuth.email?.split('@')[0] || "User",
          role: userData.role as UserData["role"] || UserRoleEnum.NONE,
        });
      } else {
        setCurrentUser(null);
        toast({ title: "Error", description: "Current user data not found in Firestore. Please contact an admin.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching current user data:", error);
      setCurrentUser(null);
      toast({ title: "Error", description: "Could not fetch your user details.", variant: "destructive" });
    }
    setIsLoadingCurrentUser(false);
  }, [toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((userAuth) => {
      if (userAuth) {
        fetchCurrentUser(userAuth);
      } else {
        setCurrentUser(null);
        setIsLoadingCurrentUser(false);
        // router.push('/login'); // Consider if immediate redirect is needed if not logged in
      }
    });
    return () => unsubscribe();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!currentUser) {
        setIsLoadingStaffList(false); // Not loading if no current user
        setStaffList([]); // Clear staff list if no current user
        return;
    }
    
    setIsLoadingStaffList(true);
    const q = query(collection(db, "users"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: UserData[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setStaffList(users);
      setIsLoadingStaffList(false);
    }, (error) => {
      console.error("Error fetching staff list:", error);
      toast({ title: "Error", description: "Could not fetch staff list.", variant: "destructive" });
      setIsLoadingStaffList(false);
    });
    return () => unsubscribe();
  }, [currentUser, toast]);

  const canManageUsers = useMemo(() => currentUser?.role === UserRoleEnum.MANAGER || currentUser?.role === UserRoleEnum.DEVELOPER, [currentUser]);
  const isSupervisor = useMemo(() => currentUser?.role === UserRoleEnum.SUPERVISOR, [currentUser]);

  const handleAddUser = async (values: AddUserFormValues) => {
    if (!currentUser || !canManageUsers) {
      toast({ title: "Permission Denied", description: "You are not authorized to add users directly.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await addUserAction(values, currentUser);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const openDirectDeleteDialog = (user: UserData) => {
    if (currentUser?.uid === user.id) {
        toast({ title: "Action Not Allowed", description: "You cannot delete yourself.", variant: "destructive"});
        return;
    }
    if (currentUser?.role === UserRoleEnum.MANAGER && (user.role === UserRoleEnum.MANAGER || user.role === UserRoleEnum.DEVELOPER)) {
        toast({ title: "Action Not Allowed", description: "Managers cannot delete other managers or developers.", variant: "destructive"});
        return;
    }
    setUserToDeleteDirectly(user);
  };

  const confirmDeleteUser = async () => {
    if (!currentUser || !canManageUsers || !userToDeleteDirectly) return;
    
    setIsSubmitting(true);
    const result = await deleteUserFirestoreAction(userToDeleteDirectly.id, currentUser);
    toast({ title: result.success ? "Success" : "Error", description: result.message, variant: result.success ? "default" : "destructive" });
    setUserToDeleteDirectly(null); // Close dialog
    setIsSubmitting(false);
  };


  const openRequestDeletionDialog = (user: UserData) => {
    if (user.role === UserRoleEnum.MANAGER || user.role === UserRoleEnum.DEVELOPER || user.role === UserRoleEnum.SUPERVISOR){
        toast({title: "Action Not Allowed", description: "Supervisors cannot request deletion of other supervisors, managers, or developers.", variant: "destructive"});
        return;
    }
    setUserToRequestDelete(user);
    requestDeletionForm.reset({reasonForRequest: ""});
    setIsRequestDeleteDialogOpen(true);
  };

  const handleRequestUserDeletion = async (values: RequestDeletionFormValues) => {
    if (!currentUser || !isSupervisor || !userToRequestDelete) {
      toast({ title: "Error", description: "Cannot process request. Ensure you are logged in as a supervisor.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await requestUserDeletionAction({
      targetUserUid: userToRequestDelete.id,
      targetStaffId: userToRequestDelete.staffId,
      targetUserName: userToRequestDelete.name,
      targetUserRole: userToRequestDelete.role,
      reasonForRequest: values.reasonForRequest,
    }, currentUser);

    if (result.success) {
      toast({ title: "Request Submitted", description: result.message });
      setIsRequestDeleteDialogOpen(false);
    } else {
      toast({ title: "Request Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleRequestAddUser = async (values: RequestAddUserFormValues) => {
    if (!currentUser || !isSupervisor) {
      toast({ title: "Permission Denied", description: "You are not authorized to request adding users.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await requestAddUserAction(values, currentUser);
    if (result.success) {
      toast({ title: "Request Submitted", description: result.message });
      setIsRequestAddUserDialogOpen(false);
      requestAddUserForm.reset();
    } else {
      toast({ title: "Request Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };


  const pageIcon = canManageUsers ? Users : UserCog;
  const descriptionText = () => {
    if (canManageUsers) return "Oversee all staff. Add new staff or remove existing ones from Firestore.";
    if (isSupervisor) return "View staff. Request to add new staff or request deletion for existing staff members.";
    return "Staff information display. Limited access.";
  };

  if (isLoadingCurrentUser) {
    return <div className="p-6"><Skeleton className="h-10 w-1/2 mb-4" /><Skeleton className="h-48 w-full" /></div>;
  }
  if (!currentUser) {
    return <div className="p-6 text-destructive text-center">Error: Could not load your user details. Please try logging in again.</div>;
  }

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {React.createElement(pageIcon, { className: "h-10 w-10 text-primary" })}
              <div>
                <CardTitle className="text-3xl">Staff Management</CardTitle>
                <CardDescription className="text-md">{descriptionText()}</CardDescription>
              </div>
            </div>
            {canManageUsers && (
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-md"><PlusCircle className="mr-2 h-5 w-5" /> Add New User</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader> <DialogTitle>Add New Staff Member</DialogTitle> <DialogDescription>Email will be {`{staffId}@mealvilla.com`}. Initial password defaults to 'password' if not set.</DialogDescription> </DialogHeader>
                  <form onSubmit={addUserForm.handleSubmit(handleAddUser)} className="space-y-4 py-4">
                    {/* Name, StaffID, Role, Password fields same as before */}
                     <div> <Label htmlFor="name_add">Full Name</Label> <Input id="name_add" {...addUserForm.register("name")} className="mt-1 rounded-md" /> {addUserForm.formState.errors.name && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.name.message}</p>} </div>
                    <div> <Label htmlFor="staffId_add">Staff ID (6 digits)</Label> <Input id="staffId_add" {...addUserForm.register("staffId")} className="mt-1 rounded-md" maxLength={6}/> {addUserForm.formState.errors.staffId && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.staffId.message}</p>} </div>
                    <div> <Label htmlFor="role_add">Role</Label>
                        <Controller name="role" control={addUserForm.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="role_add" className="mt-1 rounded-md"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                    <SelectContent>
                                        {userRoleOptions.filter(opt => currentUser.role === UserRoleEnum.DEVELOPER || (currentUser.role === UserRoleEnum.MANAGER && opt.value !== UserRoleEnum.DEVELOPER && opt.value !== UserRoleEnum.MANAGER) ).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {addUserForm.formState.errors.role && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.role.message}</p>}
                    </div>
                    <div> <Label htmlFor="initialPassword_add">Initial Password (optional, min 6 chars)</Label> <div className="relative mt-1"> <Input id="initialPassword_add" type={showPassword ? "text" : "password"} {...addUserForm.register("initialPassword")} placeholder="Defaults to 'password'" className="rounded-md pr-10" /> <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}> {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} </Button> </div> {addUserForm.formState.errors.initialPassword && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.initialPassword.message}</p>} </div>
                    <DialogFooter> <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose> <Button type="submit" disabled={isSubmitting} className="rounded-md">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} {isSubmitting ? "Adding..." : "Add User"}</Button> </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {isSupervisor && (
                 <Dialog open={isRequestAddUserDialogOpen} onOpenChange={setIsRequestAddUserDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-md bg-blue-600 hover:bg-blue-700"><UserPlus className="mr-2 h-5 w-5" /> Request Add User</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>Request to Add New Staff</DialogTitle><DialogDescription>Submit a request for a manager to add this staff member.</DialogDescription></DialogHeader>
                        <form onSubmit={requestAddUserForm.handleSubmit(handleRequestAddUser)} className="space-y-4 py-4">
                            <div><Label htmlFor="name_req_add">Full Name</Label><Input id="name_req_add" {...requestAddUserForm.register("name")} className="mt-1 rounded-md" />{requestAddUserForm.formState.errors.name && <p className="text-sm text-destructive mt-1">{requestAddUserForm.formState.errors.name.message}</p>}</div>
                            <div><Label htmlFor="staffId_req_add">Staff ID (6 digits)</Label><Input id="staffId_req_add" {...requestAddUserForm.register("staffId")} className="mt-1 rounded-md" maxLength={6} />{requestAddUserForm.formState.errors.staffId && <p className="text-sm text-destructive mt-1">{requestAddUserForm.formState.errors.staffId.message}</p>}</div>
                            <div> <Label htmlFor="role_req_add">Role to Assign</Label>
                                <Controller name="role" control={requestAddUserForm.control}
                                    render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger id="role_req_add" className="mt-1 rounded-md"><SelectValue placeholder="Select role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={UserRoleEnum.STAFF}>Staff</SelectItem>
                                            <SelectItem value={UserRoleEnum.SUPERVISOR}>Supervisor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    )}
                                />{requestAddUserForm.formState.errors.role && <p className="text-sm text-destructive mt-1">{requestAddUserForm.formState.errors.role.message}</p>}
                            </div>
                            <div> <Label htmlFor="initialPassword_req_add">Suggested Initial Password (optional, min 6 chars)</Label> <div className="relative mt-1"> <Input id="initialPassword_req_add" type={showPassword ? "text" : "password"} {...requestAddUserForm.register("initialPassword")} placeholder="Defaults to 'password'" className="rounded-md pr-10" /> <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}> {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} </Button> </div> {requestAddUserForm.formState.errors.initialPassword && <p className="text-sm text-destructive mt-1">{requestAddUserForm.formState.errors.initialPassword.message}</p>}</div>
                            <div> <Label htmlFor="reasonForRequest_req_add">Reason for Request (Optional)</Label> <Textarea id="reasonForRequest_req_add" {...requestAddUserForm.register("reasonForRequest")} className="mt-1 rounded-md" placeholder="Brief justification..." /> {requestAddUserForm.formState.errors.reasonForRequest && <p className="text-sm text-destructive mt-1">{requestAddUserForm.formState.errors.reasonForRequest.message}</p>} </div>
                            <DialogFooter><DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting} className="rounded-md">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} {isSubmitting ? "Submitting..." : "Submit Request"}</Button></DialogFooter>
                        </form>
                    </DialogContent>
                 </Dialog>
            )}
          </div>
           <p className="mt-2 text-xs text-destructive-foreground/80 bg-destructive/20 p-2 rounded-md mx-6 mb-0">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Note: Adding users creates a Firestore record. Firebase Authentication user creation is simulated or requires manual setup. Deleting a user only removes from Firestore.
            </p>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingStaffList ? (
            <div className="space-y-2"> {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)} </div>
          ) : staffList.length === 0 ? (
             <div className="mt-4 p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center bg-muted/10">
                <Users className="h-10 w-10 text-primary/60 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">No staff members found.</p>
                {canManageUsers && <p className="text-sm text-muted-foreground mt-1">Click "Add New User" to get started.</p>}
                {isSupervisor && <p className="text-sm text-muted-foreground mt-1">You can request to add new staff members if needed.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead> <TableHead>Staff ID</TableHead> <TableHead>Email</TableHead> <TableHead>Role</TableHead> <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name || "N/A"}</TableCell>
                      <TableCell>{staff.staffId}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell className="capitalize">{staff.role}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canManageUsers && currentUser.uid !== staff.id && !(currentUser.role === UserRoleEnum.MANAGER && (staff.role === UserRoleEnum.MANAGER || staff.role === UserRoleEnum.DEVELOPER)) && (
                          <Button variant="destructive" size="sm" className="rounded-md" onClick={() => openDirectDeleteDialog(staff)} disabled={isSubmitting}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        )}
                        {isSupervisor && staff.role === UserRoleEnum.STAFF && (
                           <Button variant="outline" size="sm" className="rounded-md border-amber-500 text-amber-600 hover:bg-amber-500/10" onClick={() => openRequestDeletionDialog(staff)} disabled={isSubmitting}>
                             <Send className="mr-1 h-4 w-4" /> Request Deletion
                           </Button>
                        )}
                         {currentUser.uid === staff.id && <span className="text-xs text-muted-foreground">(This is you)</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {userToDeleteDirectly && (
        <AlertDialog open={!!userToDeleteDirectly} onOpenChange={(open) => !open && setUserToDeleteDirectly(null)}>
            <AlertDialogContent>
                <AlertDialogHeader> <AlertDialogTitle>Confirm Deletion</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to delete {userToDeleteDirectly.name} (ID: {userToDeleteDirectly.staffId}) from Firestore? This action is mainly for Firestore records. True Firebase Auth deletion requires backend setup. </AlertDialogDescription> </AlertDialogHeader>
                <AlertDialogFooter> <AlertDialogCancel className="rounded-md" onClick={() => setUserToDeleteDirectly(null)}>Cancel</AlertDialogCancel> <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90 rounded-md" disabled={isSubmitting}> {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} Confirm Delete </AlertDialogAction> </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {userToRequestDelete && (
        <Dialog open={isRequestDeleteDialogOpen} onOpenChange={setIsRequestDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader> <DialogTitle>Request Deletion for {userToRequestDelete.name}</DialogTitle> <DialogDescription> Request to delete {userToRequestDelete.name} (ID: {userToRequestDelete.staffId}). This will be sent for manager approval. </DialogDescription> </DialogHeader>
            <form onSubmit={requestDeletionForm.handleSubmit(handleRequestUserDeletion)} className="space-y-4 py-4">
              <div> <Label htmlFor="reasonForRequest_del">Reason for Deletion Request (Optional)</Label> <Textarea id="reasonForRequest_del" {...requestDeletionForm.register("reasonForRequest")} className="mt-1 rounded-md" placeholder="Enter a brief reason for this request (min 10 chars if provided)" /> {requestDeletionForm.formState.errors.reasonForRequest && <p className="text-sm text-destructive mt-1">{requestDeletionForm.formState.errors.reasonForRequest.message}</p>} </div>
              <DialogFooter> <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose> <Button type="submit" disabled={isSubmitting} className="rounded-md bg-amber-500 hover:bg-amber-600 text-white"> {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : null} {isSubmitting ? "Submitting..." : "Submit Request"} </Button> </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

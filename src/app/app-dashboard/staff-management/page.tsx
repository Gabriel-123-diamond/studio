
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
import { Users, UserCog, PlusCircle, Trash2, AlertTriangle, Eye, EyeOff, Send } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import type { UserData } from "@/types/users";
import { addUserAction, deleteUserFirestoreAction, requestUserDeletionAction } from "./_actions/manageUsers";
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


enum UserRoleEnum {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer",
  STAFF = "staff",
  NONE = "none",
}

const addUserFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  staffId: z.string().regex(/^\d{6}$/, "Staff ID must be exactly 6 digits."),
  role: z.enum([UserRoleEnum.STAFF, UserRoleEnum.SUPERVISOR, UserRoleEnum.MANAGER, UserRoleEnum.DEVELOPER]),
  initialPassword: z.string().min(6, "Password must be at least 6 characters.").optional(),
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;

const requestDeletionSchema = z.object({
  reasonForRequest: z.string().min(10, "Reason must be at least 10 characters.").max(200).optional(),
});
type RequestDeletionFormValues = z.infer<typeof requestDeletionSchema>;


export default function StaffManagementPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ uid: string; name?: string; role: UserData["role"] } | null>(null);
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);
  const [staffList, setStaffList] = useState<UserData[]>([]);
  const [isLoadingStaffList, setIsLoadingStaffList] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for deletion request dialog
  const [isRequestDeleteDialogOpen, setIsRequestDeleteDialogOpen] = useState(false);
  const [userToRequestDelete, setUserToRequestDelete] = useState<UserData | null>(null);


  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { name: "", staffId: "", role: UserRoleEnum.STAFF, initialPassword: "" },
  });

  const requestDeletionForm = useForm<RequestDeletionFormValues>({
    resolver: zodResolver(requestDeletionSchema),
    defaultValues: { reasonForRequest: "" },
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
        toast({ title: "Error", description: "Current user data not found.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching current user data:", error);
      setCurrentUser(null);
      toast({ title: "Error", description: "Could not fetch your details.", variant: "destructive" });
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
      }
    });
    return () => unsubscribe();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!currentUser) return; // Don't fetch staff list if no current user (or still loading)
    
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
  const canRequestDeletions = useMemo(() => currentUser?.role === UserRoleEnum.SUPERVISOR, [currentUser]);

  const handleAddUser = async (values: AddUserFormValues) => {
    if (!currentUser || !canManageUsers) {
      toast({ title: "Permission Denied", variant: "destructive" });
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

  const handleDeleteUser = async (targetUserId: string) => {
    if (!currentUser || !canManageUsers) {
      toast({ title: "Permission Denied", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await deleteUserFirestoreAction(targetUserId, currentUser);
    toast({ title: result.success ? "Success" : "Error", description: result.message, variant: result.success ? "default" : "destructive" });
    setIsSubmitting(false);
  };

  const openRequestDeletionDialog = (user: UserData) => {
    if (user.role === UserRoleEnum.MANAGER || user.role === UserRoleEnum.DEVELOPER || user.role === UserRoleEnum.SUPERVISOR){
        toast({title: "Action Not Allowed", description: "Supervisors cannot request deletion of other supervisors, managers, or developers.", variant: "destructive"});
        return;
    }
    setUserToRequestDelete(user);
    setIsRequestDeleteDialogOpen(true);
  };

  const handleRequestUserDeletion = async (values: RequestDeletionFormValues) => {
    if (!currentUser || !canRequestDeletions || !userToRequestDelete) {
      toast({ title: "Error", description: "Cannot process request.", variant: "destructive" });
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
      requestDeletionForm.reset();
    } else {
      toast({ title: "Request Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };


  const pageIcon = canManageUsers ? Users : UserCog;
  const descriptionText = () => {
    if (canManageUsers) return "Oversee all staff members. Add, edit, or remove staff (from Firestore) across departments and manage their roles.";
    if (canRequestDeletions) return "Manage staff within your scope. View details and request deletions for staff members.";
    return "Staff information display. Access restricted.";
  };

  if (isLoadingCurrentUser) {
    return <div className="p-6"><Skeleton className="h-48 w-full" /></div>;
  }
  if (!currentUser) {
    return <div className="p-6 text-destructive">Error: Could not load current user details.</div>;
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
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>Enter details for the new staff. Email will be {`{staffId}@mealvilla.com`}. Initial password is 'password' if not set.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={addUserForm.handleSubmit(handleAddUser)} className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" {...addUserForm.register("name")} className="mt-1 rounded-md" />
                      {addUserForm.formState.errors.name && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="staffId">Staff ID (6 digits)</Label>
                      <Input id="staffId" {...addUserForm.register("staffId")} className="mt-1 rounded-md" maxLength={6}/>
                      {addUserForm.formState.errors.staffId && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.staffId.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select onValueChange={(value) => addUserForm.setValue("role", value as UserData["role"])} defaultValue={UserRoleEnum.STAFF}>
                        <SelectTrigger id="role" className="mt-1 rounded-md">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRoleEnum.STAFF}>Staff</SelectItem>
                          <SelectItem value={UserRoleEnum.SUPERVISOR}>Supervisor</SelectItem>
                           {(currentUser.role === UserRoleEnum.DEVELOPER) && <SelectItem value={UserRoleEnum.MANAGER}>Manager</SelectItem>}
                           {(currentUser.role === UserRoleEnum.DEVELOPER) && <SelectItem value={UserRoleEnum.DEVELOPER}>Developer</SelectItem>}
                        </SelectContent>
                      </Select>
                      {addUserForm.formState.errors.role && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.role.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="initialPassword">Initial Password (optional, min 6 chars)</Label>
                        <div className="relative mt-1">
                        <Input 
                            id="initialPassword" 
                            type={showPassword ? "text" : "password"} 
                            {...addUserForm.register("initialPassword")} 
                            placeholder="Defaults to 'password'"
                            className="rounded-md pr-10" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                        </div>
                        {addUserForm.formState.errors.initialPassword && <p className="text-sm text-destructive mt-1">{addUserForm.formState.errors.initialPassword.message}</p>}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting} className="rounded-md">{isSubmitting ? "Adding..." : "Add User"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
           <p className="mt-2 text-xs text-destructive-foreground/80 bg-destructive/20 p-2 rounded-md">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Note: Adding users creates a Firestore record. Firebase Authentication user creation is simulated here due to Server Action limitations and would typically require Admin SDK setup for production. Similarly, 'Delete User' only removes from Firestore; Auth deletion needs backend.
            </p>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingStaffList ? (
            <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-muted-foreground">No staff members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.staffId}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell className="capitalize">{staff.role}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* Manager/Developer direct delete */}
                        {canManageUsers && currentUser.uid !== staff.id && !(currentUser.role === UserRoleEnum.MANAGER && (staff.role === UserRoleEnum.MANAGER || staff.role === UserRoleEnum.DEVELOPER)) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="rounded-md" disabled={isSubmitting}>
                                <Trash2 className="mr-1 h-4 w-4" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {staff.name} (ID: {staff.staffId}) from Firestore? This action is mainly for Firestore records. True Firebase Auth deletion requires backend setup.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(staff.id)} className="bg-destructive hover:bg-destructive/90 rounded-md">
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {/* Supervisor request deletion */}
                        {canRequestDeletions && staff.role === UserRoleEnum.STAFF && (
                           <Button variant="outline" size="sm" className="rounded-md border-amber-500 text-amber-600 hover:bg-amber-500/10" onClick={() => openRequestDeletionDialog(staff)}>
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

      {/* Dialog for Supervisor to Request Deletion */}
      {userToRequestDelete && (
        <Dialog open={isRequestDeleteDialogOpen} onOpenChange={setIsRequestDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Deletion for {userToRequestDelete.name}</DialogTitle>
              <DialogDescription>
                You are requesting to delete staff member {userToRequestDelete.name} (ID: {userToRequestDelete.staffId}, Role: {userToRequestDelete.role}). 
                This request will be sent to a manager for approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={requestDeletionForm.handleSubmit(handleRequestUserDeletion)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="reasonForRequest">Reason for Deletion Request (Optional)</Label>
                <Input 
                    id="reasonForRequest" 
                    {...requestDeletionForm.register("reasonForRequest")} 
                    className="mt-1 rounded-md" 
                    placeholder="Enter a brief reason for this request"
                />
                 {requestDeletionForm.formState.errors.reasonForRequest && <p className="text-sm text-destructive mt-1">{requestDeletionForm.formState.errors.reasonForRequest.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" className="rounded-md">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting} className="rounded-md bg-amber-500 hover:bg-amber-600 text-white">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}


"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, MessageSquareWarning, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationData } from "@/types/notifications";
import { sendNotificationAction } from "./_actions/sendNotification";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";


enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

const sendNotificationSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500),
});

type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;

export default function NotificationsPage() {
  const { toast } = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string | null>(null); 
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const form = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  });

  const fetchCurrentUserDetails = useCallback(async (user: FirebaseUser | null) => {
    setIsLoadingUserDetails(true);
    if (user) {
      setFirebaseUser(user);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUserRole(userData.role as UserRole || UserRole.NONE);
          setUserName(userData.name || user.email?.split('@')[0] || "User");
        } else {
          setCurrentUserRole(UserRole.NONE);
          setUserName("User");
          toast({ title: "User Data Error", description: "Your user details could not be found.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setCurrentUserRole(UserRole.NONE);
        setUserName("User");
        toast({ title: "Session Error", description: "Could not retrieve user details.", variant: "destructive" });
      }
    } else {
      setCurrentUserRole(UserRole.NONE);
      setFirebaseUser(null);
      setUserName(null);
    }
    setIsLoadingUserDetails(false);
  }, [toast]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(fetchCurrentUserDetails);
    return () => unsubscribeAuth();
  }, [fetchCurrentUserDetails]);

  useEffect(() => {
    setIsLoadingNotifications(true);
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: NotificationData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotifications.push({ id: doc.id, ...doc.data() } as NotificationData);
      });
      setNotifications(fetchedNotifications);
      setIsLoadingNotifications(false);
    }, (error) => {
      console.error("Error fetching notifications: ", error);
      toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive" });
      setIsLoadingNotifications(false);
    });

    return () => unsubscribeNotifications();
  }, [toast]);

  async function onSubmitNotification(values: SendNotificationFormValues) {
    if (!firebaseUser || !currentUserRole || currentUserRole === UserRole.NONE || currentUserRole === UserRole.STAFF) {
      toast({ title: "Permission Denied", description: "You are not authorized to send notifications.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    const result = await sendNotificationAction({
      senderId: firebaseUser.uid,
      senderName: userName || firebaseUser.email || "System User",
      senderRole: currentUserRole,
      title: values.title,
      message: values.message,
    });

    if (result.success) {
      toast({ title: "Success!", description: result.message });
      form.reset();
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
    setIsSending(false);
  }

  const canSendNotifications = currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.SUPERVISOR || currentUserRole === UserRole.DEVELOPER;

  if (isLoadingUserDetails) {
    return (
      <div className="w-full flex flex-col flex-1 space-y-6">
        <Card className="shadow-lg rounded-lg flex-1 flex flex-col">
          <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
            <div className="flex items-center space-x-4"> <Skeleton className="h-10 w-10 rounded-full" /> <div> <Skeleton className="h-8 w-48 rounded" /> <Skeleton className="h-4 w-64 mt-1 rounded" /> </div> </div>
          </CardHeader>
          <CardContent className="p-6 flex-1"> <Skeleton className="h-32 w-full rounded" /> <Skeleton className="h-20 w-full mt-4 rounded" /> </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 space-y-6"> {/* Ensure this container can grow */}
      <Card className="shadow-xl rounded-lg overflow-hidden flex flex-col flex-1"> {/* Card grows and is flex column */}
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center space-x-4">
            <Bell className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Notifications</CardTitle>
              <CardDescription className="text-md">
                {canSendNotifications 
                  ? "Send new alerts and view received notifications." 
                  : "View alerts for new tasks, messages, and system updates."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {canSendNotifications && (
          <CardContent className="p-6 border-b"> {/* Form content, does not grow */}
            <form onSubmit={form.handleSubmit(onSubmitNotification)} className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground/90">Send a New Notification</h3>
              <div>
                <Label htmlFor="title" className="text-foreground/80">Title</Label>
                <Input id="title" {...form.register("title")} placeholder="E.g., System Maintenance Alert" className="mt-1 rounded-md" />
                {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="message" className="text-foreground/80">Message</Label>
                <Textarea id="message" {...form.register("message")} placeholder="Enter your notification message here..." className="mt-1 rounded-md" rows={4} />
                {form.formState.errors.message && <p className="text-sm text-destructive mt-1">{form.formState.errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={isSending} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md w-full sm:w-auto">
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSending ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        )}

        <CardContent className="p-6 flex-1 flex flex-col min-h-0"> {/* List content, grows and is flex column */}
          <h3 className="text-xl font-semibold mb-4 text-foreground/90">
            {canSendNotifications ? "Received & Sent Notifications" : "Received Notifications"}
          </h3>
          {isLoadingNotifications ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center flex-1 flex flex-col justify-center items-center">
              <MessageSquareWarning className="h-12 w-12 text-primary/70 mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Notifications Yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                {canSendNotifications ? "Send a notification to get started, or check back later." : "Check back later for updates."}
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-2"> {/* ScrollArea takes remaining space */}
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <Card key={notif.id} className="shadow-sm rounded-lg hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{notif.title}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Sent by: {notif.senderName || notif.senderRole} ({notif.senderRole}) - {}
                        {notif.timestamp ? formatDistanceToNow(notif.timestamp.toDate(), { addSuffix: true }) : 'Sending...'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-foreground/90">{notif.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {currentUserRole === UserRole.NONE && !isLoadingUserDetails && (
        <Card className="shadow-lg rounded-lg border-destructive mt-6"> {/* Ensures spacing if this card appears */}
          <CardHeader className="bg-destructive/10 p-6 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <CardTitle className="text-2xl text-destructive">Access Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-lg text-destructive-foreground">Your role could not be determined.</p>
            <p className="mt-1 text-muted-foreground">Please ensure you are logged in correctly and your user role is configured in Firestore.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


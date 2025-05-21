
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Send, AlertTriangle } from "lucide-react"; 
import React, { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";


enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer", 
  STAFF = "staff", 
  NONE = "none",
}

export default function ApprovalRequestsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    setIsLoading(true);
    const roleFromStorage = localStorage.getItem("userRole") as UserRole | null;
    if (roleFromStorage) {
      setCurrentUserRole(roleFromStorage);
    } else {
      setCurrentUserRole(UserRole.NONE); 
    }
    setIsLoading(false);
  }, []);

  const isManagerView = currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER;
  const isSupervisorView = currentUserRole === UserRole.SUPERVISOR;

  if (isLoading) {
    return (
      <div className="w-full">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                    <Skeleton className="h-8 w-48 mb-1 rounded" />
                    <Skeleton className="h-4 w-64 rounded" />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-3/4 mb-4 rounded" />
            <div className="mt-8 p-8 border border-dashed rounded-lg">
                <Skeleton className="h-6 w-1/2 mx-auto rounded" />
                <Skeleton className="h-4 w-1/3 mx-auto mt-2 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            {isManagerView ? <CheckCircle className="h-10 w-10 text-primary" /> : 
             isSupervisorView ? <Send className="h-10 w-10 text-primary" /> :
             <AlertTriangle className="h-10 w-10 text-destructive" />
            }
            <div>
              <CardTitle className="text-3xl">
                {isManagerView ? "Manage Approval Requests" : 
                 isSupervisorView ? "Submit Requests" :
                 "Approval Requests"}
              </CardTitle>
              <CardDescription className="text-md">
                {isManagerView 
                  ? "Receive and manage approval requests from Supervisors (e.g., staff deletion, promotions)."
                  : isSupervisorView
                  ? "Submit requests for staff deletion, promotion, or other actions to Managers for approval."
                  : "This section is for managing or submitting approval requests."
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isManagerView ? (
            <p className="text-lg">Managers can view, approve, or reject requests for staff changes or other significant actions submitted by Supervisors.</p>
          ) : isSupervisorView ? (
            <p className="text-lg">Supervisors can use this section to create and send requests (e.g., for staff promotions, deletions, resource allocation) to Managers.</p>
          ) : (
            <p className="text-lg text-muted-foreground">You do not have specific actions for approval requests in your current role. Contact an administrator if you believe this is an error.</p>
          )}
          
          {(isManagerView || isSupervisorView) && (
            <>
            <p className="mt-2 text-muted-foreground">The request and approval workflow, including forms, lists of pending/approved/rejected requests, and notification systems, will be implemented here.</p>
            <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
                <p className="text-xl font-semibold text-muted-foreground">
                {isManagerView ? "Approval Request Dashboard" : "Request Submission Portal"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                {isManagerView ? "List of pending requests, history, and management tools coming soon." : "Forms for creating various request types coming soon."}
                </p>
            </div>
            </>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
}

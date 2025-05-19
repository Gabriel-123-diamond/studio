
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Send } from "lucide-react"; // Using CheckCircle for Manager, Send for Supervisor
import React, { useEffect, useState } from 'react';

enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer",
  NONE = "none",
}

export default function ApprovalRequestsPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem("userRole") as UserRole | null;
      if (storedRole) {
        setCurrentUserRole(storedRole);
      }
    }
  }, []);

  const isManagerView = currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER;

  return (
    <div className="w-full">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            {isManagerView ? <CheckCircle className="h-10 w-10 text-primary" /> : <Send className="h-10 w-10 text-primary" />}
            <div>
              <CardTitle className="text-3xl">
                {isManagerView ? "Approval Requests" : "Submit Requests"}
              </CardTitle>
              <CardDescription className="text-md">
                {isManagerView 
                  ? "Receive and manage approval requests from Supervisors (e.g., staff deletion, promotions)."
                  : "Submit requests for staff deletion or promotion to Managers for approval."
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isManagerView ? (
            <p>This is where Managers can view, approve, or reject requests submitted by Supervisors.</p>
          ) : (
            <p>Supervisors can use this section to create and send requests to Managers.</p>
          )}
          <p className="mt-4 text-muted-foreground">The request and approval workflow will be implemented here.</p>
          
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <p className="text-lg text-muted-foreground">
              {isManagerView ? "Approval request list" : "Request submission form"} coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

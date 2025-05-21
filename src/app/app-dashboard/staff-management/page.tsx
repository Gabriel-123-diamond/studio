
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer",
  STAFF = "staff", // Added for completeness
  NONE = "none",
}

export default function StaffManagementPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserRole(userDocSnap.data().role as UserRole || UserRole.NONE);
          } else {
            setCurrentUserRole(UserRole.NONE);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setCurrentUserRole(UserRole.NONE);
        }
      } else {
        setCurrentUserRole(UserRole.NONE);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const descriptionText = () => {
    if (currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER) {
      return "View, add, edit, or remove staff members across all departments. Assign and change roles.";
    }
    if (currentUserRole === UserRole.SUPERVISOR) {
      return "Manage staff in Sales, Storekeeper, Baker, and Accountant departments. Edit permissions and request promotions/deletions.";
    }
    return "Staff management interface.";
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading...</p></div>;
  }


  return (
    <div className="w-full">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Staff Management</CardTitle>
              <CardDescription className="text-md">
                {descriptionText()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p>This section allows for the administration of all staff members. Features will vary based on your role.</p>
          <ul className="list-disc list-inside mt-4 space-y-1 text-muted-foreground">
            {(currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER) && <li>Full control over all staff and departments.</li>}
            {currentUserRole === UserRole.SUPERVISOR && <li>Manage staff within your assigned departments (Sales, Storekeeper, Baker, Accountant).</li>}
            <li>View staff grouped by department.</li>
          </ul>
          {/* Placeholder for staff listing and management tools */}
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <p className="text-lg text-muted-foreground">Staff management interface coming soon.</p>
            <p className="text-sm text-muted-foreground">Features will be role-specific.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

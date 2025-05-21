
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCog } from "lucide-react"; // UserCog or Users
import React, { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";


enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  DEVELOPER = "developer",
  STAFF = "staff", 
  NONE = "none",
}

export default function StaffManagementPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserRole(userDocSnap.data().role as UserRole || UserRole.NONE);
          } else {
            setCurrentUserRole(UserRole.NONE);
          }
        } catch (error) {
          console.error("Error fetching user role for staff management:", error);
          setCurrentUserRole(UserRole.NONE);
        }
      } else {
        setCurrentUserRole(UserRole.NONE);
      }
      setIsLoadingSession(false);
    });
    return () => unsubscribe();
  }, []);

  const descriptionText = () => {
    if (currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER) {
      return "Oversee all staff members. Add, edit, or remove staff across departments and manage their roles.";
    }
    if (currentUserRole === UserRole.SUPERVISOR) {
      return "Manage staff within your assigned departments (e.g., Sales, Storekeeping, Bakery, Accounts). Edit details and request promotions or deletions.";
    }
    return "Staff information display. Access restricted."; 
  };

  const pageIcon = currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER ? Users : UserCog;

  if (isLoadingSession) {
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
            {React.createElement(pageIcon, { className: "h-10 w-10 text-primary" })}
            <div>
              <CardTitle className="text-3xl">Staff Management</CardTitle>
              <CardDescription className="text-md">
                {descriptionText()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-lg">This section allows for the administration of staff members. Features will vary based on your role.</p>
          
          {(currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER || currentUserRole === UserRole.SUPERVISOR) ? (
            <>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                {(currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER) && 
                  <li>Full control to add, edit, and remove any staff member and manage roles across all departments via Firestore.</li>
                }
                {currentUserRole === UserRole.SUPERVISOR && 
                  <li>Manage staff within your assigned departments (Sales, Storekeeper, Baker, Accountant). View details, edit certain information, and submit requests for promotions or deletions.</li>
                }
                <li>View staff profiles, typically grouped by department or role.</li>
                <li>Search and filter staff members.</li>
              </ul>
              <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
                <p className="text-xl font-semibold text-muted-foreground">Staff Listing & Management Tools</p>
                <p className="text-sm text-muted-foreground mt-2">Detailed staff tables, editing forms, and role assignment interfaces will be implemented here.</p>
              </div>
            </>
          ) : (
            <div className="mt-8 p-8 border border-dashed border-destructive/50 rounded-lg text-center bg-destructive/10">
              <p className="text-lg font-semibold text-destructive">Access Denied</p>
              <p className="text-destructive-foreground">You do not have permission to manage staff.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

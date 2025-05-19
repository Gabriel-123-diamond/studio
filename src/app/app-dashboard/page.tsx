
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer", // SuperAdmin effectively
  NONE = "none",
}

export default function AppDashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem("userRole") as UserRole | null;
      if (storedRole) {
        setCurrentUserRole(storedRole);
      }
      setIsLoadingRole(false);
    }
  }, []);

  const getWelcomeMessage = () => {
    switch (currentUserRole) {
      case UserRole.MANAGER:
        return "Welcome, Manager! Oversee operations and manage your teams.";
      case UserRole.DEVELOPER:
        return "Welcome, Developer! Access all features and developer tools.";
      case UserRole.SUPERVISOR:
        return "Welcome, Supervisor! Manage your department and staff tasks.";
      case UserRole.STAFF:
        return "Welcome! View your tasks and stay updated.";
      default:
        return "Welcome to Meal Villa!";
    }
  };

  if (isLoadingRole) {
    return (
      <div className="w-full">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-4" />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-md">
                  <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-1" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Main Application Dashboard</CardTitle>
          <CardDescription>{getWelcomeMessage()}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content area. Your role-specific widgets and components will appear here.</p>
          
          {/* Placeholder content based on role, can be expanded */}
          {currentUserRole === UserRole.MANAGER && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">Team Performance</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Manager-specific stats.</p></CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">Pending Approvals</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">View requests needing action.</p></CardContent>
              </Card>
               <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">System Health</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Overview of system status.</p></CardContent>
              </Card>
            </div>
          )}

          {currentUserRole === UserRole.SUPERVISOR && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">Department Tasks</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Tasks for your department.</p></CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">Staff Activity</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Recent activity from your team.</p></CardContent>
              </Card>
            </div>
          )}

          {currentUserRole === UserRole.STAFF && (
             <div className="mt-8">
              <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl">Your Active Tasks</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">List of tasks assigned to you.</p></CardContent>
              </Card>
            </div>
          )}

          { (currentUserRole === UserRole.NONE || (!isManager && !isSupervisor && !isStaff && currentUserRole !== UserRole.DEVELOPER)) && (
             <div className="mt-8 text-center text-muted-foreground">
                <p>No specific dashboard view for your current role or role not identified.</p>
             </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}

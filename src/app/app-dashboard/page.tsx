
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

export default function AppDashboardPage() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    setIsLoadingRole(true);
    const roleFromStorage = localStorage.getItem("userRole") as UserRole | null;
    if (roleFromStorage) {
      setCurrentUserRole(roleFromStorage);
    } else {
      setCurrentUserRole(UserRole.NONE); 
    }
    setIsLoadingRole(false);
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

  const isManager = currentUserRole === UserRole.MANAGER;
  const isSupervisor = currentUserRole === UserRole.SUPERVISOR;
  const isStaff = currentUserRole === UserRole.STAFF;
  const isDeveloper = currentUserRole === UserRole.DEVELOPER;


  if (isLoadingRole) {
    return (
      <div className="w-full">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="p-6">
            <Skeleton className="h-8 w-3/4 mb-2 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-full mb-4 rounded" />
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="shadow-md rounded-lg">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-1/2 mb-1 rounded" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2 rounded" />
                    <Skeleton className="h-24 w-full rounded-lg" />
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
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="p-6 bg-muted/30 rounded-t-lg">
          <CardTitle className="text-3xl">Main Application Dashboard</CardTitle>
          <CardDescription className="text-md">{getWelcomeMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-lg">This is your main content area. Role-specific widgets and components will appear here.</p>
          
          {(isManager || isDeveloper) && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">Team Performance</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">Summary of team activities and performance metrics.</p></CardContent>
              </Card>
              <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">Pending Approvals</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">View requests awaiting your action.</p></CardContent>
              </Card>
               <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">System Health</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">Overview of application status and key metrics.</p></CardContent>
              </Card>
            </div>
          )}

          {isSupervisor && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">Department Tasks</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">Overview of tasks for your department.</p></CardContent>
              </Card>
              <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">Staff Activity</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">Recent activity logs from your team members.</p></CardContent>
              </Card>
            </div>
          )}

          {isStaff && (
             <div className="mt-8">
              <Card className="shadow-md rounded-lg">
                <CardHeader className="p-4"><CardTitle className="text-xl">Your Active Tasks</CardTitle></CardHeader>
                <CardContent className="p-4"><p className="text-muted-foreground">A list of tasks currently assigned to you.</p></CardContent>
              </Card>
            </div>
          )}

           {(currentUserRole === UserRole.NONE || (!isManager && !isSupervisor && !isStaff && !isDeveloper)) && !isLoadingRole && (
             <div className="mt-8 p-8 border border-dashed border-destructive/50 rounded-lg text-center bg-destructive/10">
                <p className="text-lg font-semibold text-destructive">Access Issue</p>
                <p className="text-destructive-foreground">No specific dashboard view for your current role, or your role could not be identified.</p>
                <p className="text-sm text-muted-foreground mt-2">Please ensure you are logged in correctly and your role is properly configured in the system. If this issue persists, contact an administrator.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

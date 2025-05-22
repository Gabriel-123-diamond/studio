
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { 
  Home, Settings, User, LogOut, MenuSquare, 
  Users, CheckCircle, LineChart, History, ShieldCheck as Shield, // Manager/Dev icons, changed Shield to ShieldCheck
  UserCog, Send, ListChecks, // Supervisor icons
  Bell as BellIcon, ClipboardPenLine // Staff icons (ClipboardPenLine for Sales Entry)
} from 'lucide-react';
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { UserData } from '@/types/users'; 

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 

enum UserRoleEnum { 
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

const getPageTitle = (pathname: string): string => {
  const parts = pathname.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];

  if (pathname === '/app-dashboard') return 'Dashboard';
  
  if (lastPart) {
    return lastPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Meal Villa'; 
};

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg text-muted-foreground">Loading your Meal Villa experience...</p>
    </div>
  </div>
);

export default function AppDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const fetchedUserData = userDocSnap.data() as Omit<UserData, 'id'>;
            setCurrentUserData({ id: user.uid, ...fetchedUserData, role: fetchedUserData.role || UserRoleEnum.NONE });
            if (!fetchedUserData.role) {
                 console.warn("User document in Firestore is missing 'role' field for UID:", user.uid);
            }
          } else {
            console.error("User document not found in Firestore for UID:", user.uid);
            toast({ title: "User Data Error", description: "Your user details could not be found. Please contact support.", variant: "destructive" });
            setCurrentUserData({ id: user.uid, staffId: "N/A", name: user.email || "Unknown", email: user.email || "", role: UserRoleEnum.NONE });
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          toast({ title: "Session Error", description: "Could not retrieve user details. Please try again.", variant: "destructive" });
           setCurrentUserData({ id: user.uid, staffId: "N/A", name: user.email || "Unknown", email: user.email || "", role: UserRoleEnum.NONE });
        }
      } else {
        setCurrentUserData(null);
        setFirebaseUser(null);
      }
      setIsLoadingSession(false);
    });
    return () => unsubscribe();
  }, [isMounted, toast]);


  useEffect(() => {
    if (!isMounted || isLoadingSession) return;

    if (!firebaseUser) {
      if (!pathname.startsWith('/login')) { // Check if not already on login
        router.push('/login');
      }
    }
  }, [isMounted, isLoadingSession, firebaseUser, router, pathname]);


  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUserData(null);
      setFirebaseUser(null);
      toast({title: "Logged Out", description: "You have been successfully logged out."});
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive"});
    }
  };

  const pageTitle = getPageTitle(pathname);
  const currentUserRole = currentUserData?.role || UserRoleEnum.NONE;
  
  const isManager = currentUserRole === UserRoleEnum.MANAGER;
  const isSupervisor = currentUserRole === UserRoleEnum.SUPERVISOR;
  const isStaff = currentUserRole === UserRoleEnum.STAFF;
  const isDeveloper = currentUserRole === UserRoleEnum.DEVELOPER;

  const userEmailDisplay = currentUserData?.email || "user@mealvilla.com";
  const userNameDisplay = currentUserData 
    ? `${currentUserData.name || (currentUserData.role.charAt(0).toUpperCase() + currentUserData.role.slice(1))} (ID: ${currentUserData.staffId || 'N/A'})`
    : "User";
  const avatarFallback = userNameDisplay.substring(0,2).toUpperCase();
  
  const canAccessPage = () => {
    if (!isMounted || isLoadingSession) return true; // Allow rendering loading spinner or initial content

    // If still loading or not mounted, don't make access decisions yet
    if (currentUserRole === UserRoleEnum.NONE && !(pathname === '/app-dashboard/profile' || pathname === '/app-dashboard/settings')) {
      if (!pathname.startsWith('/login')) router.push('/login'); // Use pathname here
      return false;
    }
    
    const managerRoutes = ['/app-dashboard/role-management', '/app-dashboard/activity-overview', '/app-dashboard/audit-trail'];
    const devRoutes = ['/app-dashboard/dev-tools'];
    const supervisorRoutes = ['/app-dashboard/activity-tracking'];
    const staffRoutes = ['/app-dashboard/notifications', '/app-dashboard/sales-entry'];
    const sharedApprovalRoute = '/app-dashboard/approval-requests';
    const sharedStaffManagementRoute = '/app-dashboard/staff-management';


    if (isDeveloper) return true; 

    if (isManager) {
      if (devRoutes.includes(pathname)) return false; 
      return true; 
    }
    if (isSupervisor) {
      if (managerRoutes.includes(pathname) || devRoutes.includes(pathname)) return false;
      if (pathname === sharedApprovalRoute || pathname === sharedStaffManagementRoute || supervisorRoutes.includes(pathname) || staffRoutes.includes(pathname)) return true;
    }
    if (isStaff) {
      if (managerRoutes.includes(pathname) || devRoutes.includes(pathname) || supervisorRoutes.includes(pathname) || pathname === sharedApprovalRoute || pathname === sharedStaffManagementRoute) return false;
      if (staffRoutes.includes(pathname)) return true;
    }
    
    // Common pages accessible by all authenticated users
    if (pathname === '/app-dashboard' || pathname === '/app-dashboard/profile' || pathname === '/app-dashboard/settings') return true;

    // If no specific rule matched for an authenticated user with a role, and it's not a common page, deny
    if (currentUserRole !== UserRoleEnum.NONE) { 
      // For example, if a staff tries to access a supervisor-only page not explicitly listed above
      const allAllowedSupervisorRoutes = [...supervisorRoutes, sharedApprovalRoute, sharedStaffManagementRoute, ...staffRoutes, '/app-dashboard/notifications', '/app-dashboard', '/app-dashboard/profile', '/app-dashboard/settings'];
      if (isSupervisor && allAllowedSupervisorRoutes.includes(pathname)) return true;

      const allAllowedStaffRoutes = [...staffRoutes, '/app-dashboard', '/app-dashboard/profile', '/app-dashboard/settings', '/app-dashboard/notifications'];
      if (isStaff && allAllowedStaffRoutes.includes(pathname)) return true;
    }


    return false; 
  };

  if (!isMounted || isLoadingSession) {
    return <LoadingScreen />;
  }

  if (!firebaseUser && !pathname.startsWith('/login')) {
    return <LoadingScreen />; // Continue showing loading while redirect effect runs
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r group/sidebar-internal">
          <SidebarHeader className="p-4">
            <Link href="/app-dashboard" className="flex items-center gap-2 group-data-[state=collapsed]/sidebar-internal:justify-center">
              <MenuSquare className="h-8 w-8 text-primary group-data-[state=collapsed]/sidebar-internal:h-6 group-data-[state=collapsed]/sidebar-internal:w-6" />
              <span className="text-xl font-semibold text-primary group-data-[state=collapsed]/sidebar-internal:hidden">Meal Villa</span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="flex-1 p-2">
            <SidebarMenu>
              {/* Common Links */}
              <SidebarMenuItem>
                <SidebarMenuButton href="/app-dashboard" tooltip="Home" isActive={pathname === '/app-dashboard'}>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/app-dashboard/profile" tooltip="Profile" isActive={pathname === '/app-dashboard/profile'}>
                  <User />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/app-dashboard/settings" tooltip="Settings" isActive={pathname === '/app-dashboard/settings'}>
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Developer/Manager Specific Links */}
              {(isManager || isDeveloper) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/role-management" tooltip="Role Management" isActive={pathname === '/app-dashboard/role-management'}>
                      <Users /> 
                      <span>Role Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/staff-management" tooltip="Staff Management" isActive={pathname === '/app-dashboard/staff-management'}>
                      <UserCog /> 
                      <span>Staff Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/approval-requests" tooltip="Approval Requests" isActive={pathname === '/app-dashboard/approval-requests'}>
                      <CheckCircle />
                      <span>Approval Requests</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/activity-overview" tooltip="Activity Overview" isActive={pathname === '/app-dashboard/activity-overview'}>
                      <LineChart />
                      <span>Activity Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/audit-trail" tooltip="Audit Trail" isActive={pathname === '/app-dashboard/audit-trail'}>
                      <History />
                      <span>Audit Trail</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                   {isDeveloper && (
                     <SidebarMenuItem>
                       <SidebarMenuButton href="/app-dashboard/dev-tools" tooltip="Developer Tools" isActive={pathname === '/app-dashboard/dev-tools'}>
                         <Shield />
                         <span>Dev Tools</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   )}
                </>
              )}

              {/* Supervisor Specific Links */}
              {isSupervisor && !isManager && !isDeveloper && ( 
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/staff-management" tooltip="Manage My Staff" isActive={pathname === '/app-dashboard/staff-management'}>
                      <UserCog />
                      <span>Manage My Staff</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/approval-requests" tooltip="Approval Requests" isActive={pathname === '/app-dashboard/approval-requests'}>
                      <Send />
                      <span>Approval Requests</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/activity-tracking" tooltip="Activity Tracking" isActive={pathname === '/app-dashboard/activity-tracking'}>
                      <ListChecks />
                      <span>Activity Tracking</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              
              {/* Staff Specific Links */}
              {isStaff && !isManager && !isDeveloper && !isSupervisor && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/sales-entry" tooltip="Sales Entry" isActive={pathname === '/app-dashboard/sales-entry'}>
                      <ClipboardPenLine />
                      <span>Sales Entry</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
                {/* General Notifications Link - accessible by more roles if needed */}
                {(isManager || isDeveloper || isSupervisor || isStaff) && ( 
                     <SidebarMenuItem>
                        <SidebarMenuButton href="/app-dashboard/notifications" tooltip="Notifications" isActive={pathname === '/app-dashboard/notifications'}>
                        <BellIcon />
                        <span>Notifications</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}


            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 group-data-[state=collapsed]/sidebar-internal:justify-center">
              <Avatar className="h-9 w-9 group-data-[state=collapsed]/sidebar-internal:h-7 group-data-[state=collapsed]/sidebar-internal:w-7">
                <AvatarImage src={currentUserData?.avatarUrl || "https://placehold.co/100x100.png"} alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="group-data-[state=collapsed]/sidebar-internal:hidden">
                <p className="text-sm font-medium truncate max-w-[120px]">{userNameDisplay}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{userEmailDisplay}</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2 md:hidden" /> 
              <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {canAccessPage() ? children : (
                <div className="w-full">
                    <Card className="shadow-lg rounded-lg border-destructive">
                        <CardHeader className="p-6 bg-destructive/10 rounded-t-lg">
                            <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-lg text-destructive-foreground">You do not have permission to view this page.</p>
                            <p className="mt-2 text-muted-foreground">Your current role is <span className="font-semibold">{currentUserRole}</span>. Please contact an administrator if you believe this is an error.</p>
                            <Button onClick={() => router.push('/app-dashboard')} className="mt-4 rounded-md">Go to Dashboard</Button>
                        </CardContent>
                    </Card>
                </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

    
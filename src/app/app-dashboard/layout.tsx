
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { 
  Home, Settings, User, LogOut, MenuSquare, 
  CheckCircle, Users, LineChart, History, // Manager icons
  UserCog, Send, ListChecks, // Supervisor icons
  ClipboardList, Bell as BellIcon, Palette, KeyRound, Shield // Staff icons (Bell, Palette, KeyRound are generic)
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';


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


enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

// Helper function to determine the page title
const getPageTitle = (pathname: string): string => {
  if (pathname === '/app-dashboard') return 'Dashboard';
  if (pathname === '/app-dashboard/profile') return 'Profile';
  if (pathname === '/app-dashboard/settings') return 'Settings';
  if (pathname === '/app-dashboard/role-management') return 'Role Management';
  if (pathname === '/app-dashboard/staff-management') return 'Staff Management';
  if (pathname === '/app-dashboard/approval-requests') return 'Approval Requests';
  if (pathname === '/app-dashboard/activity-overview') return 'Activity Overview';
  if (pathname === '/app-dashboard/audit-trail') return 'Audit Trail';
  if (pathname === '/app-dashboard/my-tasks') return 'My Tasks';
  if (pathname === '/app-dashboard/notifications') return 'Notifications';
  if (pathname === '/app-dashboard/activity-tracking') return 'Activity Tracking';
  if (pathname === '/app-dashboard/dev-tools') return 'Developer Tools';
  return 'Meal Villa'; // Default title
};

export default function AppDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        // Fetch user role from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUserRole(userData.role as UserRole || UserRole.NONE);
            setStaffId(userData.staffId || null);
          } else {
            console.warn("User document not found in Firestore for UID:", user.uid);
            setCurrentUserRole(UserRole.NONE); // Or handle as an error
            // Potentially sign out user if role is critical and not found
            // await signOut(auth); 
            // router.push('/login');
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setCurrentUserRole(UserRole.NONE);
          // Potentially sign out user
          // await signOut(auth);
          // router.push('/login');
        }
      } else {
        setAuthUser(null);
        setCurrentUserRole(UserRole.NONE);
        setStaffId(null);
        router.push('/login'); // Redirect if no user
      }
      setIsLoadingRole(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // router.push('/login'); // onAuthStateChanged will handle redirect
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally show a toast notification for logout error
    }
  };

  const pageTitle = getPageTitle(pathname);

  if (isLoadingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }
  
  const isManager = currentUserRole === UserRole.MANAGER || currentUserRole === UserRole.DEVELOPER;
  const isSupervisor = currentUserRole === UserRole.SUPERVISOR;
  const isStaff = currentUserRole === UserRole.STAFF;


  const userEmail = authUser?.email || (staffId ? `${staffId}@mealvilla.com` : "user@mealvilla.com");
  const userName = currentUserRole !== UserRole.NONE ? `${currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)} User` : "User";
  const avatarFallback = userName.substring(0,2).toUpperCase();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" side="left" variant="sidebar" className="border-r">
          <SidebarHeader className="p-4">
            <Link href="/app-dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <MenuSquare className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
              <span className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">Meal Villa</span>
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
              {(isManager) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/role-management" tooltip="Role Management" isActive={pathname === '/app-dashboard/role-management'}>
                      <Users /> 
                      <span>Role Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/staff-management" tooltip="Staff Management" isActive={pathname === '/app-dashboard/staff-management'}>
                      <Users />
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
                   {currentUserRole === UserRole.DEVELOPER && (
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
              {isSupervisor && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/staff-management" tooltip="Manage Staff" isActive={pathname === '/app-dashboard/staff-management'}>
                      <UserCog />
                      <span>Manage Staff</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/approval-requests" tooltip="Send Requests" isActive={pathname === '/app-dashboard/approval-requests'}>
                      <Send />
                      <span>Send Requests</span>
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
              {isStaff && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/my-tasks" tooltip="My Tasks" isActive={pathname === '/app-dashboard/my-tasks'}>
                      <ClipboardList />
                      <span>My Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/app-dashboard/notifications" tooltip="Notifications" isActive={pathname === '/app-dashboard/notifications'}>
                      <BellIcon />
                      <span>Notifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
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
            <Button variant="outline" size="sm" onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { 
  Home, Settings, User, LogOut, MenuSquare, 
  Users, CheckCircle, LineChart, History, // Manager icons (Users for Role Management)
  UserCog, Send, ListChecks, // Supervisor icons
  ClipboardList, Bell as BellIcon, Palette, KeyRound, Shield // Staff icons & generic
} from 'lucide-react';
// Firebase imports removed
// import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';

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

enum UserRole {
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

export default function AppDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.NONE);
  const [staffId, setStaffId] = useState<string | null>(null);
  // FirebaseUser state removed: const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    setIsLoadingRole(true);
    const roleFromStorage = localStorage.getItem("userRole") as UserRole | null;
    const staffIdFromStorage = localStorage.getItem("staffId");

    if (roleFromStorage && staffIdFromStorage) {
      setCurrentUserRole(roleFromStorage);
      setStaffId(staffIdFromStorage);
    } else {
      setCurrentUserRole(UserRole.NONE);
      setStaffId(null);
      router.push('/login'); // Redirect if no role/staffId in localStorage
    }
    setIsLoadingRole(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("staffId");
    // localStorage.removeItem("authUser"); // If it was ever set
    setCurrentUserRole(UserRole.NONE);
    setStaffId(null);
    toast({title: "Logged Out", description: "You have been successfully logged out."});
    router.push('/login');
  };

  const pageTitle = getPageTitle(pathname);

  if (isLoadingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <p>Loading user session...</p>
        </div>
      </div>
    );
  }
  
  const isManager = currentUserRole === UserRole.MANAGER;
  const isSupervisor = currentUserRole === UserRole.SUPERVISOR;
  const isStaff = currentUserRole === UserRole.STAFF;
  const isDeveloper = currentUserRole === UserRole.DEVELOPER;

  // Using staffId for email and name display as per pre-Firebase logic
  const userEmailDisplay = staffId ? `${staffId}@mealvilla.com` : "user@mealvilla.com";
  const userNameDisplay = currentUserRole !== UserRole.NONE 
    ? `${currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)} User (ID: ${staffId || 'N/A'})` 
    : "User";
  const avatarFallback = userNameDisplay.substring(0,2).toUpperCase();

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
                      <BellIcon /> {/* Using aliased BellIcon */}
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

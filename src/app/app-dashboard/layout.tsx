
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Settings, User, LogOut, MenuSquare } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    // Add any logout logic here (e.g., clearing session, tokens)
    router.push('/login');
  };

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
              <SidebarMenuItem>
                <SidebarMenuButton href="/app-dashboard" tooltip="Home">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/app-dashboard/profile" tooltip="Profile">
                  <User />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" data-state="closed"> {/* Add data-state for sub-menu handling if needed */}
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
                {/* Example Submenu - can be expanded later */}
                {/* <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/app-dashboard/settings/account">
                      Account
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/app-dashboard/settings/preferences">
                      Preferences
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub> */}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>MV</AvatarFallback>
              </Avatar>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">Staff User</p>
                <p className="text-xs text-muted-foreground">staff@mealvilla.com</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center">
              <SidebarTrigger className="mr-2 md:hidden" /> {/* Hidden on md and up where sidebar rail is visible */}
               <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
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

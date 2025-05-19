
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  // Placeholder - For Staff roles 
  return (
    <div className="w-full">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <Bell className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Notifications</CardTitle>
              <CardDescription className="text-md">
                Receive alerts for new tasks, messages, or changes in schedule. (Staff View)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p>Stay informed with important updates and alerts relevant to your role and tasks.</p>
          <p className="mt-4 text-muted-foreground">Notification feed and management options will be here.</p>
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <p className="text-lg text-muted-foreground">Notification center coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

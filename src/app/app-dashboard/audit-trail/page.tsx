
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ShieldAlert } from "lucide-react";

export default function AuditTrailPage() {
  // This page is intended for Managers/Developers.
  // Access control should be primarily handled by the layout based on role.

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <History className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Audit Trail</CardTitle>
              <CardDescription className="text-md">
                View logs of significant actions taken by Supervisors and other staff. (Manager/Developer View)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-lg">This section provides a detailed and immutable log of significant actions performed within the system for auditing, security, and compliance purposes.</p>
          <p className="mt-2 text-muted-foreground">Track user logins, role changes, staff modifications, approval events, and other critical system activities.</p>
          
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <div className="flex justify-center items-center mb-4">
                <ShieldAlert className="h-12 w-12 text-primary/70" />
            </div>
            <p className="text-xl font-semibold text-muted-foreground">Secure Audit Log Interface</p>
            <p className="text-sm text-muted-foreground mt-2">Filterable and searchable audit logs with timestamps and user details coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

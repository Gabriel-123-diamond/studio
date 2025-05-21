
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Activity } from "lucide-react";

export default function ActivityOverviewPage() {
  // This page is intended for Managers/Developers.
  // Access control should be primarily handled by the layout based on role.

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <LineChart className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Activity Overview</CardTitle>
              <CardDescription className="text-md">
                View aggregated reports and summaries of activities from all departments. (Manager/Developer View)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-lg">Managers and Developers can access comprehensive reports, activity summaries, and key performance indicators across all departments here.</p>
          <p className="mt-2 text-muted-foreground">This will include data visualizations, trend analysis, and detailed logs to monitor overall operational efficiency.</p>
          
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <div className="flex justify-center items-center mb-4">
                <Activity className="h-12 w-12 text-primary/70" />
            </div>
            <p className="text-xl font-semibold text-muted-foreground">Advanced Activity Dashboards</p>
            <p className="text-sm text-muted-foreground mt-2">Charts, graphs, and filterable report generators coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function ActivityOverviewPage() {
  // Placeholder - For Managers
  return (
    <div className="w-full">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <LineChart className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Activity Overview</CardTitle>
              <CardDescription className="text-md">
                View reports and summaries of activities from all departments. (Manager View)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p>Managers can access comprehensive reports and activity summaries here.</p>
          <p className="mt-4 text-muted-foreground">Data visualizations and detailed logs will be available.</p>
          <div className="mt-8 p-8 border border-dashed border-muted-foreground/50 rounded-lg text-center">
            <p className="text-lg text-muted-foreground">Activity reports and dashboards coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

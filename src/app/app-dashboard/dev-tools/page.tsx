
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Settings2, DatabaseZap, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DevToolsPage() {
  // This page is intended for users with the Developer role.
  // Access control is handled by the layout based on role fetched from Firebase.
  const { toast } = useToast();

  const handleMockAction = (actionName: string) => {
    toast({
      title: "Developer Action Triggered",
      description: `${actionName} functionality is a placeholder.`,
      variant: "default"
    });
    console.log(`Developer Tool Action: ${actionName} triggered (mock).`);
  };

  return (
    <div className="w-full">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Developer Tools</CardTitle>
              <CardDescription className="text-md">
                Advanced tools and configurations for application development, maintenance, and debugging. (Developer Access Only)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <p className="text-lg">This area provides developers with special functionalities such as system configurations, direct data manipulation utilities (e.g., Firestore interactions), performance monitoring, and feature toggles.</p>
          
          <section className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary"/> System Configuration</h3>
            <p className="text-muted-foreground mb-4">Access to advanced system settings, environment variables, and parameters. Modify with extreme caution.</p>
            <div className="p-4 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm font-medium">Mock Configuration Panel:</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground mt-2">
                <li>API Endpoint Settings</li>
                <li>Feature Flag Management</li>
                <li>Cache Control</li>
              </ul>
               <Button variant="outline" size="sm" className="mt-3 rounded-md" onClick={() => handleMockAction("System Config Update")}>Update Config (Mock)</Button>
            </div>
          </section>

          <section className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 flex items-center"><DatabaseZap className="mr-2 h-5 w-5 text-primary"/> Data Management Utilities</h3>
            <p className="text-muted-foreground mb-4">Tools for direct Firestore interaction, data seeding, or migration tasks. Use with extreme care as these actions can be destructive.</p>
            <div className="p-4 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm font-medium">Mock Data Utilities:</p>
              <ul className="list-disc list-inside text-xs text-muted-foreground mt-2">
                <li>Seed Firestore (Users, Roles)</li>
                <li>Clear Specific Collections</li>
                <li>Run Data Migration Script</li>
              </ul>
              <Button variant="destructive" size="sm" className="mt-3 mr-2 rounded-md" onClick={() => handleMockAction("Seed Database")}>Seed Data (Mock)</Button>
              <Button variant="destructive" size="sm" className="mt-3 rounded-md" onClick={() => handleMockAction("Clear Cache")}>Clear Cache (Mock)</Button>
            </div>
          </section>

           <section className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3 flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5 text-primary"/> Feature Toggles</h3>
            <p className="text-muted-foreground mb-4">Enable or disable experimental features or different application behaviors.</p>
            <div className="p-4 border border-dashed rounded-lg bg-muted/20">
              <p className="text-sm font-medium">Mock Feature Toggles:</p>
               <ul className="list-disc list-inside text-xs text-muted-foreground mt-2">
                <li>Enable New Dashboard UI: OFF</li>
                <li>Enable AI Assistant: ON</li>
              </ul>
               <Button variant="outline" size="sm" className="mt-3 rounded-md" onClick={() => handleMockAction("Toggle Feature")}>Toggle Feature (Mock)</Button>
            </div>
          </section>

          <div className="mt-6 bg-destructive/10 border border-destructive/50 p-4 rounded-lg flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
                <h4 className="text-md font-semibold text-destructive">Critical Warning!</h4>
                <p className="text-sm text-destructive-foreground">
                Actions performed in this developer panel can have significant and potentially irreversible impacts on the application data and stability. Proceed with extreme caution and ensure you understand the consequences.
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

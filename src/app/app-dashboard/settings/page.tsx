
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Bell, Palette, KeyRound, Save, Settings2 } from "lucide-react";
import { Input } from '@/components/ui/input'; // Import Input for password fields
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("system");
  const { toast } = useToast();

  const handleSaveChanges = () => {
    // Simulate saving settings
    console.log("Settings saved:", { emailNotifications, pushNotifications, theme });
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
      variant: "default",
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
         <div className="flex items-center space-x-4">
            <Settings2 className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Application Settings</CardTitle>
              <CardDescription className="text-md">Manage your application preferences and account settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Notification Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <Bell className="mr-2 h-5 w-5 text-primary" />
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card">
                <Label htmlFor="email-notifications" className="flex-1 cursor-pointer">
                  Email Notifications
                  <p className="text-xs text-muted-foreground">Receive important updates via email.</p>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  aria-label="Toggle email notifications"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card">
                <Label htmlFor="push-notifications" className="flex-1 cursor-pointer">
                  Push Notifications
                  <p className="text-xs text-muted-foreground">Get real-time alerts on your device (if supported).</p>
                </Label>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  aria-label="Toggle push notifications"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Appearance Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <Palette className="mr-2 h-5 w-5 text-primary" />
              Appearance
            </h3>
            <RadioGroup defaultValue="system" value={theme} onValueChange={setTheme} className="space-y-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg shadow-sm bg-card">
                <RadioGroupItem value="light" id="theme-light" aria-label="Light theme" />
                <Label htmlFor="theme-light" className="cursor-pointer">Light Mode</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg shadow-sm bg-card">
                <RadioGroupItem value="dark" id="theme-dark" aria-label="Dark theme" />
                <Label htmlFor="theme-dark" className="cursor-pointer">Dark Mode</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg shadow-sm bg-card">
                <RadioGroupItem value="system" id="theme-system" aria-label="System theme" />
                <Label htmlFor="theme-system" className="cursor-pointer">System Default</Label>
              </div>
            </RadioGroup>
          </section>

          <Separator />

          {/* Account Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <KeyRound className="mr-2 h-5 w-5 text-primary" />
              Account
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input type="password" id="current-password" placeholder="Enter your current password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input type="password" id="new-password" placeholder="Enter a new password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input type="password" id="confirm-password" placeholder="Confirm your new password" className="mt-1" />
              </div>
              <Button variant="outline" className="w-full md:w-auto">Change Password</Button>
            </div>
          </section>
          
          <Separator />

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

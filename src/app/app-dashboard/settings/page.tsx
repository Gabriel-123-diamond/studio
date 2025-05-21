
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Bell, Palette, KeyRound, Save, Settings2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [theme, setTheme] = useState("system"); // "light", "dark", "system"
  const { toast } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveChanges = () => {
    // In a real app, you would send these settings to a backend or save to localStorage/Firebase
    console.log("Settings saved:", { emailNotifications, pushNotifications, theme });
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
      variant: "default", // "default", "destructive", or custom
      duration: 3000,
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement actual Firebase password change logic
    // This would involve re-authenticating the user with currentPassword, then updating to newPassword
    console.log("Attempting to change password. Current:", currentPassword, "New:", newPassword);
    toast({
      title: "Password Change Requested",
      description: "Password change functionality is a placeholder.",
    });
    // Reset fields after attempt
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };


  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
         <div className="flex items-center space-x-4">
            <Settings2 className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">Application Settings</CardTitle>
              <CardDescription className="text-md">Manage your application preferences and account settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-10">
          {/* Notification Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <Bell className="mr-3 h-6 w-6 text-primary" />
              Notification Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card hover:bg-muted/10 transition-colors">
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
              <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-card hover:bg-muted/10 transition-colors">
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
              <Palette className="mr-3 h-6 w-6 text-primary" />
              Appearance
            </h3>
            <RadioGroup defaultValue="system" value={theme} onValueChange={setTheme} className="space-y-2">
              {['light', 'dark', 'system'].map((themeOption) => (
                <div key={themeOption} className="flex items-center space-x-3 p-3 border rounded-lg shadow-sm bg-card hover:bg-muted/10 transition-colors">
                  <RadioGroupItem value={themeOption} id={`theme-${themeOption}`} aria-label={`${themeOption.charAt(0).toUpperCase() + themeOption.slice(1)} theme`} />
                  <Label htmlFor={`theme-${themeOption}`} className="cursor-pointer flex-1">
                    {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)} Mode
                    {themeOption === 'system' && <span className="text-xs text-muted-foreground ml-1">(Uses device setting)</span>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-3">Note: Actual theme switching needs to be implemented application-wide.</p>
          </section>

          <Separator />

          {/* Account Settings - Password Change */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <KeyRound className="mr-3 h-6 w-6 text-primary" />
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input type="password" id="current-password" placeholder="Enter your current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input type="password" id="new-password" placeholder="Enter a new password (min. 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input type="password" id="confirm-password" placeholder="Confirm your new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
              </div>
              <Button variant="outline" onClick={handleChangePassword} className="w-full md:w-auto border-primary text-primary hover:bg-primary/10">Change Password</Button>
            </div>
          </section>
          
          <Separator />

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

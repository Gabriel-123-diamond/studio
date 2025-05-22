
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Palette, KeyRound, Save, Settings2, Eye, EyeOff } from "lucide-react";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveChanges = () => {
    // Theme is handled by next-themes directly
    console.log("General settings saved (placeholder action)");
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
      variant: "default",
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

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "No user logged in or email not available.",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordChanging(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      let description = "Failed to change password. Please try again.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Incorrect current password.";
      } else if (error.code === 'auth/weak-password') {
        description = "New password is too weak.";
      }
      toast({
        title: "Password Change Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  if (!mounted) {
    // Avoid rendering theme controls until client is mounted to prevent hydration mismatch
    return null; 
  }

  return (
    <div className="w-full">
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
          {/* Appearance Settings */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center text-foreground/90">
              <Palette className="mr-3 h-6 w-6 text-primary" />
              Appearance
            </h3>
            <RadioGroup value={theme} onValueChange={setTheme} className="space-y-2">
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
                <div className="relative mt-1">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    id="current-password" 
                    placeholder="Enter your current password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    className="rounded-md pr-10" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative mt-1">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    id="new-password" 
                    placeholder="Enter a new password (min. 6 characters)" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="rounded-md pr-10" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirm-password" 
                    placeholder="Confirm your new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="rounded-md pr-10" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={handleChangePassword} disabled={isPasswordChanging} className="w-full md:w-auto border-primary text-primary hover:bg-primary/10 rounded-md">
                {isPasswordChanging ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </section>
          
          <Separator />

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

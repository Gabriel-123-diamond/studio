
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit3, UserCircle, Briefcase, Building } from "lucide-react";

export default function ProfilePage() {
  // Placeholder data - in a real app, this would come from state or API
  const userProfile = {
    name: "Staff User",
    staffId: "123456",
    email: "staff@mealvilla.com",
    role: "Administrator",
    department: "Culinary Operations",
    avatarUrl: "https://placehold.co/150x150.png",
    bio: "Passionate about creating delightful culinary experiences and managing efficient kitchen operations. Loves to explore new recipes and food technologies.",
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl">User Profile</CardTitle>
              <CardDescription className="text-md">View and manage your profile details.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="flex-shrink-0">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-md">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="profile photo" />
                <AvatarFallback>{userProfile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                <Edit3 className="mr-2 h-4 w-4" /> Change Photo
              </Button>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-primary">{userProfile.name}</h2>
              <p className="text-muted-foreground">{userProfile.email}</p>
              <p className="text-sm text-foreground/80 bg-accent/10 p-3 rounded-md shadow-sm">{userProfile.bio}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground/90">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label htmlFor="staffId" className="text-muted-foreground">Staff ID</Label>
                <Input id="staffId" value={userProfile.staffId} readOnly className="mt-1 bg-muted/20" />
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <Input id="email" value={userProfile.email} readOnly className="mt-1 bg-muted/20" />
              </div>
              <div>
                <Label htmlFor="role" className="text-muted-foreground">Role</Label>
                <div className="flex items-center mt-1">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" />
                  <Input id="role" value={userProfile.role} readOnly className="bg-muted/20" />
                </div>
              </div>
              <div>
                <Label htmlFor="department" className="text-muted-foreground">Department</Label>
                <div className="flex items-center mt-1">
                   <Building className="h-5 w-5 mr-2 text-primary" />
                  <Input id="department" value={userProfile.department} readOnly className="bg-muted/20" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

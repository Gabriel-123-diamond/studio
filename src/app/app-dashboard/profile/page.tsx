
"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit3, UserCircle, Briefcase, Building, Mail, ShieldCheck } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

interface UserProfileData {
  name: string;
  staffId: string;
  email: string;
  role: string;
  department: string; 
  avatarUrl: string;
  bio: string;
}

const mockRoleDepartmentMap: { [key: string]: string } = {
  manager: "Management",
  supervisor: "Operations",
  developer: "IT/Development",
  staff: "General Staff", 
  baker: "Bakery", // Example specific staff roles
  storekeeper: "Store",
  accountant: "Finance",
  sales: "Sales",
  none: "N/A",
};

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role = userData.role || "staff"; // Default to staff if role not set
            const staffId = userData.staffId || "N/A";
            const userEmail = user.email || `${staffId}@mealvilla.com`;

            const profileData: UserProfileData = {
              name: userData.name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
              staffId: staffId,
              email: userEmail,
              role: role,
              department: mockRoleDepartmentMap[role.toLowerCase()] || "General",
              avatarUrl: userData.avatarUrl || "https://placehold.co/150x150.png",
              bio: userData.bio || `A dedicated ${role} at Meal Villa. Staff ID: ${staffId}.`,
            };
            setUserProfile(profileData);
          } else {
            setUserProfile(null); // User doc not found
          }
        } catch (error) {
          console.error("Error fetching user profile data:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null); // No user logged in
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-1 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-7 w-1/2 rounded" />
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-16 w-full rounded" />
              </div>
            </div>
            <Separator />
             <Skeleton className="h-24 w-full rounded" />
            <Separator />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card className="shadow-lg rounded-lg">
                <CardHeader className="bg-muted/30 p-6 rounded-t-lg">
                     <CardTitle className="text-3xl">Profile Not Available</CardTitle>
                     <CardDescription className="text-md">User profile could not be loaded. Please ensure you are logged in and your user data is correctly set up in Firestore.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }
  
  const avatarFallback = userProfile.name ? userProfile.name.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
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
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="mt-4 w-full rounded-md">
                <Edit3 className="mr-2 h-4 w-4" /> Change Photo
              </Button>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-primary">{userProfile.name}</h2>
              <div className="flex items-center justify-center md:justify-start text-muted-foreground">
                <Mail className="mr-2 h-5 w-5" />
                <span>{userProfile.email}</span>
              </div>
              <p className="text-sm text-foreground/80 bg-accent/10 p-3 rounded-md shadow-sm">{userProfile.bio}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-6 text-foreground/90">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <Label htmlFor="staffId" className="text-sm font-medium text-muted-foreground">Staff ID</Label>
                  <p id="staffId" className="text-lg font-semibold">{userProfile.staffId}</p>
                </div>
              </div>
               <div className="flex items-center space-x-3">
                <Briefcase className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-muted-foreground">Role</Label>
                  <p id="role" className="text-lg font-semibold">{userProfile.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <Label htmlFor="department" className="text-sm font-medium text-muted-foreground">Department</Label>
                  <p id="department" className="text-lg font-semibold">{userProfile.department}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

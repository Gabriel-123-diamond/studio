
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogoutAndRedirect = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Logout Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl shadow-lg rounded-lg">
          <CardHeader className="p-6">
            <Skeleton className="h-10 w-3/4 mx-auto mb-2 rounded" />
            <Skeleton className="h-6 w-1/2 mx-auto rounded" />
          </CardHeader>
          <CardContent className="mt-6 p-6">
            <Skeleton className="h-4 w-full mb-8 rounded" />
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Skeleton className="h-10 w-full sm:w-32 rounded" />
              <Skeleton className="h-10 w-full sm:w-48 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl text-center shadow-lg rounded-lg">
        <CardHeader className="p-6">
          <CardTitle className="text-4xl font-bold text-primary">Welcome to Meal Villa!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your culinary journey is authenticated.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 p-6">
          <p className="mb-8 text-foreground/90">
            You have successfully logged in. Proceed to your main application dashboard.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10 rounded-md"
              onClick={handleLogoutAndRedirect}
            >
              Back to Login
            </Button>
            <Button asChild className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
              <Link href="/app-dashboard">Proceed to App Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Lock, Badge, Eye, EyeOff, UserCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; 

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginFormSchema = z.object({
  staffId: z.string().regex(/^\d{6}$/, { message: "Staff ID must be exactly 6 digits." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.push("/app-dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      staffId: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    const email = `${values.staffId}@mealvilla.com`; 
    const password = values.password;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      let userRole = "User"; // Default role

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            userRole = userDocSnap.data().role || "User";
          } else {
            console.warn("User document not found in Firestore for UID:", firebaseUser.uid);
          }
        } catch (docError) {
          console.error("Error fetching user role from Firestore:", docError);
        }
      }
      
      const roleDisplay = userRole.charAt(0).toUpperCase() + userRole.slice(1);

      toast({
        title: "Login Successful!",
        description: `Welcome Back! Role: ${roleDisplay}. Redirecting to dashboard...`,
        variant: "default",
      });
      router.push("/dashboard"); 
    } catch (error: any) {
      let errorMessage = "Login Failed. Please check your Staff ID and password.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid Staff ID or Password.";
      } else if (error.code === "auth/invalid-email") {
        // This case should be less common now with Staff ID validation, but good to keep
        errorMessage = "Invalid Staff ID format (ensure it's 6 digits).";
      }
      console.error("Firebase login error:", error);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      form.reset({ staffId: values.staffId, password: "" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <CardHeader className="text-center p-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Meal Villa</CardTitle>
          <CardDescription className="text-md text-muted-foreground">Sign in to access your culinary world.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Staff ID</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Badge className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type="text" 
                          placeholder="e.g., 123456" 
                          {...field} 
                          className="pl-10 rounded-md"
                          aria-label="Staff ID"
                          maxLength={6}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 pr-10 rounded-md" 
                          aria-label="Password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md" 
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

    

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Lock, Badge, Eye, EyeOff, UserCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
// Firebase Auth import removed: import { signInWithEmailAndPassword } from "firebase/auth";
// Firebase lib import removed: import { auth } from "@/lib/firebase"; 

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

// Reinstating UserRole enum for mock login
enum UserRole {
  MANAGER = "manager",
  SUPERVISOR = "supervisor",
  STAFF = "staff",
  DEVELOPER = "developer",
  NONE = "none",
}

// Mock user data - this was the pre-Firebase structure
const mockUsers: { [key: string]: { role: UserRole, password?: string } } = {
  "111111": { role: UserRole.MANAGER, password: "password" }, 
  "222222": { role: UserRole.SUPERVISOR, password: "password" },
  "333333": { role: UserRole.STAFF, password: "password" }, 
  "000000": { role: UserRole.DEVELOPER, password: "superpassword" } 
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already "logged in" via localStorage
    const storedRole = localStorage.getItem("userRole");
    if (storedRole && storedRole !== UserRole.NONE) {
      router.push("/app-dashboard");
    }
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      staffId: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const staffId = values.staffId;
    const password = values.password;
    const userDetails = mockUsers[staffId];

    if (userDetails && userDetails.password === password) {
      localStorage.setItem("userRole", userDetails.role);
      localStorage.setItem("staffId", staffId); // Store staffId

      toast({
        title: "Login Successful!",
        description: "Welcome back! Redirecting to dashboard...",
        variant: "default",
      });
      router.push("/app-dashboard");
    } else {
      let errorMessage = "Invalid Staff ID or Password.";
      // Add more specific error messages for mock users if needed
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      form.reset({ staffId: values.staffId, password: "" });
    }
  }

  return (
    <>
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Meal Villa</CardTitle>
          <CardDescription>Sign in to access your culinary world.</CardDescription>
        </CardHeader>
        <CardContent>
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
                          className="pl-10"
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
                          className="pl-10 pr-10" 
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
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                disabled={form.formState.isSubmitting}
                aria-busy={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

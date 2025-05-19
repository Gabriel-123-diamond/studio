
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-primary">Welcome to Meal Villa!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Your personalized culinary journey starts here.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <p className="mb-8 text-foreground/90">
            This is your dashboard. Explore recipes, plan your meals, and discover new flavors.
          </p>
          <div className="flex justify-center">
            <Button asChild variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

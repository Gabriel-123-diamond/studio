
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl text-center shadow-lg rounded-lg">
        <CardHeader className="p-6">
          <CardTitle className="text-4xl font-bold text-primary">Welcome to Meal Villa!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your personalized culinary journey starts here.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 p-6">
          <p className="mb-8 text-foreground/90">
            This is your intermediate dashboard. From here, you can proceed to the main application.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button asChild variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
              <Link href="/login">Back to Login</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/app-dashboard">Proceed to App Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppDashboardPage() {
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Main Application Dashboard</CardTitle>
          <CardDescription>This is the main content area. Add your widgets and components here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Welcome to your application dashboard!</p>
          {/* Placeholder content */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Display some key metrics here.</p>
                 <div className="mt-4 h-32 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Chart or data coming soon...</p>
                 </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Show a feed of recent actions.</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>User John Doe updated profile.</li>
                  <li>New recipe "Pasta Carbonara" added.</li>
                  <li>Meal plan for next week generated.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Important alerts and notifications.</p>
                <div className="mt-4 text-sm text-primary">
                    You have 3 new notifications.
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

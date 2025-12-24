import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Briefcase, Shield, Settings, AlertTriangle, Activity, Database, UserCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();

  const quickActions = [
    { icon: <Users className="w-5 h-5" />, label: 'Manage Users', description: 'View all accounts' },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Job Listings', description: 'Moderate posts' },
    { icon: <AlertTriangle className="w-5 h-5" />, label: 'Reports', description: 'Handle issues' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', description: 'Platform config' },
  ];

  const stats = [
    { icon: <Users className="w-5 h-5" />, label: 'Total Users', value: '0' },
    { icon: <UserCheck className="w-5 h-5" />, label: 'Recruiters', value: '0' },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Job Posts', value: '0' },
    { icon: <Activity className="w-5 h-5" />, label: 'Active Today', value: '0' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-admin flex items-center justify-center text-primary-foreground">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Admin Control Panel</h2>
          <p className="text-muted-foreground">Monitor and manage the entire platform</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-admin-primary/10 text-admin-primary flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h3 className="text-xl font-semibold mb-4">Administration</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md hover:border-admin-primary/30 transition-all animate-fade-in"
              style={{ animationDelay: `${(index + 4) * 0.1}s` }}
            >
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg gradient-admin text-primary-foreground flex items-center justify-center mb-2">
                  {action.icon}
                </div>
                <CardTitle className="text-lg">{action.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{action.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <Card className="mt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

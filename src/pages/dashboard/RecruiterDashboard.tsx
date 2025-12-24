import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Briefcase, Eye, Clock, CheckCircle } from 'lucide-react';
import { PostJobDialog } from '@/components/jobs/PostJobDialog';
import { RecruiterJobsList } from '@/components/jobs/RecruiterJobsList';

export default function RecruiterDashboard() {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const stats = [
    { icon: <Briefcase className="w-5 h-5" />, label: 'Active Jobs', value: '0' },
    { icon: <Eye className="w-5 h-5" />, label: 'Total Views', value: '0' },
    { icon: <Clock className="w-5 h-5" />, label: 'Pending', value: '0' },
    { icon: <CheckCircle className="w-5 h-5" />, label: 'Hired', value: '0' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-recruiter flex items-center justify-center text-primary-foreground">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold">Recruiter Dashboard</h1>
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
          <h2 className="text-3xl font-bold mb-2">Recruiter Central</h2>
          <p className="text-muted-foreground">Find and hire the best talent for your team</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-recruiter-primary/10 text-recruiter-primary flex items-center justify-center">
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

        {/* Job Posting Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Job Listings</h3>
          <PostJobDialog onJobPosted={() => setRefreshTrigger(prev => prev + 1)} />
        </div>

        <RecruiterJobsList refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}

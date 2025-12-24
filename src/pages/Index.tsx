import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, Shield, ArrowRight, Sparkles, Users, TrendingUp } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Smart Matching',
      description: 'AI-powered job matching connects candidates with their ideal positions',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Talent Pool',
      description: 'Access thousands of qualified professionals across industries',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Real-time insights and recruitment analytics dashboard',
    },
  ];

  const roles = [
    {
      id: 'user',
      icon: <User className="w-8 h-8" />,
      title: 'Job Seeker',
      description: 'Find your dream job and advance your career',
      color: 'bg-user-primary',
      hoverColor: 'hover:border-user-primary/50',
    },
    {
      id: 'recruiter',
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Recruiter',
      description: 'Discover and hire top talent efficiently',
      color: 'gradient-recruiter',
      hoverColor: 'hover:border-recruiter-primary/50',
    },
    {
      id: 'admin',
      icon: <Shield className="w-8 h-8" />,
      title: 'Administrator',
      description: 'Manage users and oversee platform operations',
      color: 'gradient-admin',
      hoverColor: 'hover:border-admin-primary/50',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              <span className="text-gradient">RecruitPro</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              The modern recruitment platform that connects talent with opportunity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="gap-2">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose RecruitPro?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg gradient-secondary flex items-center justify-center text-secondary-foreground mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Path</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Whether you're looking for your next career move or searching for the perfect candidate, RecruitPro has you covered
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {roles.map((role, index) => (
              <Card
                key={role.id}
                className={`cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${role.hoverColor} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate('/auth')}
              >
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 mx-auto rounded-2xl ${role.color} text-primary-foreground flex items-center justify-center mb-4`}>
                    {role.icon}
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{role.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2024 RecruitPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

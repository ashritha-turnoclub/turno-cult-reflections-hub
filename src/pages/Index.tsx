
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Brain, Users, BookOpen, TrendingUp, Mail, Lock } from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return email.endsWith('@turno.club');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email Domain",
        description: "Only @turno.club emails are allowed to sign up.",
      });
      setIsLoading(false);
      return;
    }

    // Mock signup process - in real implementation, this would connect to Supabase
    toast({
      title: "Sign Up Successful!",
      description: "Welcome to Turno.Cult. Redirecting to dashboard...",
    });
    
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock login process - in real implementation, this would connect to Supabase
    toast({
      title: "Login Successful!",
      description: "Welcome back. Redirecting to dashboard...",
    });
    
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Brain className="h-12 w-12 text-purple-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Turno.<span className="text-purple-300">Cult</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Reflective Leadership Tracker - Empowering leaders through structured reflection, 
            team collaboration, and AI-powered insights.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Features Section */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500/20 rounded-lg p-3">
                  <Users className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
                  <p className="text-gray-300">Create questionnaires, assign to leaders, and track responses with real-time feedback.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500/20 rounded-lg p-3">
                  <BookOpen className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Private Reflection</h3>
                  <p className="text-gray-300">Maintain personal diary entries with rich formatting, categories, and timeline tracking.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-green-500/20 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Progress Tracking</h3>
                  <p className="text-gray-300">Set focus areas, track completion percentages, and compare quarterly progress.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500/20 rounded-lg p-3">
                  <Brain className="h-6 w-6 text-orange-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-300">Get intelligent summaries of your reflections and progress with actionable recommendations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="lg:max-w-md mx-auto w-full">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">Get Started</CardTitle>
                <CardDescription className="text-gray-300">
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/10">
                    <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your.name@turno.club"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            required
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-300">
                          Only @turno.club email addresses are allowed to sign up.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your.name@turno.club"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 "
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                            required
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

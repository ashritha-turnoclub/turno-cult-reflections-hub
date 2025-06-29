
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Mail, Lock, User, CheckCircle, UserCheck } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
  const { user, signIn, signUp, resendConfirmation } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ceo' | 'leader'>('leader');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if user came from email confirmation
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 5000);
    }
  }, [searchParams]);

  if (user && user.email_confirmed_at) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, name, role);
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      // Navigation will happen automatically through auth state change
    }
    setIsLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (email) {
      setIsLoading(true);
      await resendConfirmation(email);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
              <Brain className="h-8 w-8 text-purple-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Turno.<span className="text-purple-300">Cult</span>
          </h1>
          <p className="text-gray-300">Reflective Leadership Tracker</p>
        </div>

        {showConfirmation && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              Your email has been confirmed! You can now sign in to your account.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Welcome</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
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

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendConfirmation}
                      className="text-purple-300 hover:text-purple-200"
                      disabled={!email}
                    >
                      Haven't confirmed your email? Resend confirmation
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role" className="text-white">Role</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <Select value={role} onValueChange={(value: 'ceo' | 'leader') => setRole(value)}>
                        <SelectTrigger className="pl-10 bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leader">Leader</SelectItem>
                          <SelectItem value="ceo">CEO</SelectItem>
                        </SelectContent>
                      </Select>
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
  );
};

export default Auth;

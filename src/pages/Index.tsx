
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, BookOpen, TrendingUp } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <Brain className="h-12 w-12 text-purple-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Turno.<span className="text-purple-300">Cult</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Reflective Leadership Tracker - Empowering leaders through structured reflection, 
            team collaboration, and AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <a href="/auth">Get Started</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              <a href="/auth">Sign In</a>
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500/20 rounded-lg p-2">
                  <Users className="h-6 w-6 text-purple-300" />
                </div>
                <CardTitle className="text-white">Team Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Create questionnaires, assign to leaders, and track responses with real-time feedback.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/20 rounded-lg p-2">
                  <BookOpen className="h-6 w-6 text-blue-300" />
                </div>
                <CardTitle className="text-white">Private Reflection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Maintain personal diary entries with rich formatting, categories, and timeline tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/20 rounded-lg p-2">
                  <TrendingUp className="h-6 w-6 text-green-300" />
                </div>
                <CardTitle className="text-white">Progress Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Set focus areas, track completion percentages, and compare quarterly progress.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500/20 rounded-lg p-2">
                  <Brain className="h-6 w-6 text-orange-300" />
                </div>
                <CardTitle className="text-white">AI-Powered Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Get intelligent summaries of your reflections and progress with actionable recommendations.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

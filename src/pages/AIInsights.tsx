
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, MessageCircle, RefreshCw, Settings } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Summary {
  id: string;
  type: string;
  content: string;
  quarter: string | null;
  year: number | null;
  created_at: string;
}

const AIInsights = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      fetchSummaries();
      checkApiKey();
    }
  }, [userProfile]);

  const checkApiKey = async () => {
    try {
      // Check if OpenAI API key is configured
      const { data, error } = await supabase.functions.invoke('check-openai-key');
      if (!error && data?.hasKey) {
        setHasApiKey(true);
      }
    } catch (error) {
      console.log('API key check failed:', error);
    }
  };

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load AI insights.",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!userProfile?.id) return;

    try {
      setGenerating(true);

      // Fetch user data for insights
      const [questionnaires, diaryEntries, focusAreas] = await Promise.all([
        supabase
          .from('questionnaire_assignments')
          .select(`
            *,
            questionnaires(*),
            answers(*)
          `)
          .eq('leader_id', userProfile.id)
          .not('submitted_at', 'is', null),
        
        supabase
          .from('diary_entries')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('focus_areas')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Generate insights using edge function
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          userId: userProfile.id,
          questionnaires: questionnaires.data || [],
          diaryEntries: diaryEntries.data || [],
          focusAreas: focusAreas.data || [],
          userRole: userProfile.role
        }
      });

      if (error) throw error;

      toast({
        title: "Insights Generated",
        description: "Your AI insights have been generated successfully.",
      });

      fetchSummaries();
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate insights.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;

    try {
      setLoading(true);
      
      // Save API key to Supabase secrets
      const { error } = await supabase.functions.invoke('save-openai-key', {
        body: { apiKey }
      });

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved securely.",
      });

      setHasApiKey(true);
      setShowApiKeyDialog(false);
      setApiKey('');
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save API key.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Brain className="h-8 w-8 mr-3 text-purple-600" />
                    AI Insights
                  </h1>
                  <p className="text-gray-600">Your personal AI coach and insights</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!hasApiKey && (
                  <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Setup API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure OpenAI API Key</DialogTitle>
                        <DialogDescription>
                          Enter your OpenAI API key to enable AI insights generation. Your key will be stored securely.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-key">OpenAI API Key</Label>
                          <Input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            required
                          />
                          <p className="text-sm text-gray-500">
                            Get your API key from{' '}
                            <a 
                              href="https://platform.openai.com/api-keys" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              OpenAI Platform
                            </a>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={saveApiKey} disabled={loading || !apiKey.trim()} className="flex-1">
                            {loading ? "Saving..." : "Save API Key"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowApiKeyDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button 
                  onClick={generateInsights} 
                  disabled={generating || !hasApiKey}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generating ? "Generating..." : "Generate Insights"}
                </Button>
              </div>
            </div>

            {!hasApiKey && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-amber-600" />
                    <div>
                      <h3 className="font-medium text-amber-900">Setup Required</h3>
                      <p className="text-sm text-amber-700">
                        Configure your OpenAI API key to start generating personalized insights.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6">
              {loading && summaries.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </CardContent>
                </Card>
              ) : summaries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Brain className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Generate your first AI insights to get personalized coaching and recommendations.
                    </p>
                    {hasApiKey && (
                      <Button onClick={generateInsights} disabled={generating}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Your First Insight
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                summaries.map((summary) => (
                  <Card key={summary.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                            AI Coaching Insight
                          </CardTitle>
                          <CardDescription>
                            Generated on {new Date(summary.created_at).toLocaleDateString()}
                            {summary.quarter && summary.year && (
                              <Badge variant="outline" className="ml-2">
                                {summary.quarter} {summary.year}
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{summary.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700">
                          {summary.content}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AIInsights;

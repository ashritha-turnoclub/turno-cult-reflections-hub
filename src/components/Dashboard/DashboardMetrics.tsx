
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  totalLeaders?: number;
  activeQuestionnaires?: number;
  pendingResponses?: number;
  completedResponses?: number;
  upcomingDeadlines?: number;
  focusAreas?: any[];
  recentActivity?: any[];
  assignedQuestionnaires?: any[];
  diaryEntries?: number;
}

export const DashboardMetrics = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (userProfile?.role === 'ceo') {
        await fetchCEOData();
      } else {
        await fetchLeaderData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCEOData = async () => {
    try {
      // Fetch total leaders
      const { data: leaders, error: leadersError } = await supabase
        .from('leaders')
        .select('*')
        .eq('ceo_id', userProfile?.id);

      if (leadersError) throw leadersError;

      // Fetch questionnaires
      const { data: questionnaires, error: questionnairesError } = await supabase
        .from('questionnaires')
        .select('*, questionnaire_assignments(*)')
        .eq('created_by', userProfile?.id);

      if (questionnairesError) throw questionnairesError;

      // Calculate metrics
      const activeQuestionnaires = questionnaires?.filter(q => q.published).length || 0;
      const totalAssignments = questionnaires?.reduce((acc, q) => acc + (q.questionnaire_assignments?.length || 0), 0) || 0;
      const completedAssignments = questionnaires?.reduce((acc, q) => 
        acc + (q.questionnaire_assignments?.filter((a: any) => a.submitted_at).length || 0), 0) || 0;

      // Fetch focus areas
      const { data: focusAreas } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch diary entries count
      const { count: diaryCount } = await supabase
        .from('diary_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile?.id);

      setData({
        totalLeaders: leaders?.length || 0,
        activeQuestionnaires,
        pendingResponses: totalAssignments - completedAssignments,
        completedResponses: completedAssignments,
        focusAreas: focusAreas || [],
        diaryEntries: diaryCount || 0
      });
    } catch (error) {
      console.error('Error fetching CEO data:', error);
    }
  };

  const fetchLeaderData = async () => {
    try {
      // Fetch assigned questionnaires
      const { data: assignments, error: assignmentsError } = await supabase
        .from('questionnaire_assignments')
        .select(`
          *,
          questionnaires(*)
        `)
        .eq('leader_id', userProfile?.id);

      if (assignmentsError) throw assignmentsError;

      // Fetch focus areas
      const { data: focusAreas } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch diary entries count
      const { count: diaryCount } = await supabase
        .from('diary_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile?.id);

      const completedQuestionnaires = assignments?.filter(a => a.submitted_at).length || 0;
      const pendingQuestionnaires = assignments?.filter(a => !a.submitted_at).length || 0;

      setData({
        assignedQuestionnaires: assignments || [],
        completedResponses: completedQuestionnaires,
        pendingResponses: pendingQuestionnaires,
        focusAreas: focusAreas || [],
        diaryEntries: diaryCount || 0
      });
    } catch (error) {
      console.error('Error fetching leader data:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {userProfile?.role === 'ceo' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leaders</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalLeaders}</div>
                <p className="text-xs text-muted-foreground">
                  Team members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Questionnaires</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activeQuestionnaires}</div>
                <p className="text-xs text-muted-foreground">
                  Published questionnaires
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.pendingResponses}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting submission
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.diaryEntries}</div>
                <p className="text-xs text-muted-foreground">
                  Total entries
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.assignedQuestionnaires?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total assignments
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.pendingResponses}</div>
                <p className="text-xs text-muted-foreground">
                  Need to complete
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.completedResponses}</div>
                <p className="text-xs text-muted-foreground">
                  Submitted responses
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.diaryEntries}</div>
                <p className="text-xs text-muted-foreground">
                  Total entries
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Focus Areas Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Focus Areas</CardTitle>
            <CardDescription>Your current goals and progress</CardDescription>
          </div>
          <Button onClick={() => navigate('/progress')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent>
          {data.focusAreas && data.focusAreas.length > 0 ? (
            <div className="space-y-4">
              {data.focusAreas.map((area) => (
                <div key={area.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{area.title}</h4>
                    <Badge variant="outline">
                      {area.progress_percent}% complete
                    </Badge>
                  </div>
                  <Progress value={area.progress_percent} className="h-2" />
                  {area.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(area.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                onClick={() => navigate('/progress')}
                className="w-full"
              >
                View All Focus Areas
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No focus areas yet</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your goals and progress
              </p>
              <Button onClick={() => navigate('/progress')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Focus Area
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questionnaires Section for Leaders */}
      {userProfile?.role === 'leader' && data.assignedQuestionnaires && data.assignedQuestionnaires.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Questionnaires</CardTitle>
              <CardDescription>Your assigned questionnaires</CardDescription>
            </div>
            <Button onClick={() => navigate('/questionnaires')} size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.assignedQuestionnaires.slice(0, 3).map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{assignment.questionnaires?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {assignment.questionnaires?.quarter} {assignment.questionnaires?.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(assignment.questionnaires?.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={assignment.submitted_at ? "default" : "destructive"}>
                    {assignment.submitted_at ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diary Entries Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Diary</CardTitle>
            <CardDescription>Your personal reflections and notes</CardDescription>
          </div>
          <Button onClick={() => navigate('/diary')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-2xl font-bold">{data.diaryEntries}</div>
            <p className="text-sm text-muted-foreground">Total entries</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/diary')}
              className="mt-2"
            >
              View All Entries
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  BookOpen, 
  Target, 
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  totalLeaders: number;
  totalQuestionnaires: number;
  totalDiaryEntries: number;
  totalFocusAreas: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingDeadlines: any[];
  recentActivity: any[];
}

export const DashboardMetrics = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    totalLeaders: 0,
    totalQuestionnaires: 0,
    totalDiaryEntries: 0,
    totalFocusAreas: 0,
    pendingTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: [],
    recentActivity: []
  });
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
        // CEO Dashboard Data
        const [leadersData, questionnairesData, diaryData, focusData] = await Promise.all([
          supabase.from('leaders').select('*').eq('ceo_id', userProfile.id),
          supabase.from('questionnaires').select('*').eq('created_by', userProfile.id),
          supabase.from('diary_entries').select('*').eq('user_id', userProfile.id),
          supabase.from('focus_areas').select('*').eq('user_id', userProfile.id)
        ]);

        setData({
          totalLeaders: leadersData.data?.length || 0,
          totalQuestionnaires: questionnairesData.data?.length || 0,
          totalDiaryEntries: diaryData.data?.length || 0,
          totalFocusAreas: focusData.data?.length || 0,
          pendingTasks: focusData.data?.filter(f => f.progress_percent < 100).length || 0,
          completedTasks: focusData.data?.filter(f => f.progress_percent === 100).length || 0,
          upcomingDeadlines: focusData.data?.filter(f => f.deadline && new Date(f.deadline) > new Date()).slice(0, 5) || [],
          recentActivity: []
        });
      } else {
        // Leader Dashboard Data
        const [assignmentsData, diaryData, focusData] = await Promise.all([
          supabase
            .from('questionnaire_assignments')
            .select('*, questionnaires(*)')
            .eq('leader_id', userProfile.id),
          supabase.from('diary_entries').select('*').eq('user_id', userProfile.id),
          supabase.from('focus_areas').select('*').eq('user_id', userProfile.id)
        ]);

        const pendingAssignments = assignmentsData.data?.filter(a => !a.submitted_at).length || 0;
        const completedAssignments = assignmentsData.data?.filter(a => a.submitted_at).length || 0;

        setData({
          totalLeaders: 0,
          totalQuestionnaires: assignmentsData.data?.length || 0,
          totalDiaryEntries: diaryData.data?.length || 0,
          totalFocusAreas: focusData.data?.length || 0,
          pendingTasks: pendingAssignments,
          completedTasks: completedAssignments,
          upcomingDeadlines: assignmentsData.data?.filter(a => !a.submitted_at && a.questionnaires?.deadline && new Date(a.questionnaires.deadline) > new Date()).slice(0, 5) || [],
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userProfile?.role === 'ceo' ? (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/team')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalLeaders}</div>
                <p className="text-xs text-muted-foreground">Active leaders</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/questionnaires')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalQuestionnaires}</div>
                <p className="text-xs text-muted-foreground">Created questionnaires</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/questionnaires')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalQuestionnaires}</div>
                <p className="text-xs text-muted-foreground">Assigned to you</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/questionnaires')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">Awaiting completion</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/diary')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDiaryEntries}</div>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleNavigate('/progress')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Areas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFocusAreas}</div>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Upcoming Deadlines */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Task Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Completed</span>
                </div>
                <Badge variant="secondary">{data.completedTasks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="outline">{data.pendingTasks}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {data.upcomingDeadlines.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{item.title || item.questionnaires?.title}</span>
                    <span className="text-muted-foreground">
                      {new Date(item.deadline || item.questionnaires?.deadline).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {userProfile?.role === 'ceo' ? (
              <>
                <Button variant="outline" onClick={() => handleNavigate('/questionnaires')} className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Questionnaire
                </Button>
                <Button variant="outline" onClick={() => handleNavigate('/team')} className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleNavigate('/questionnaires')} className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Questionnaires
                </Button>
                <Button variant="outline" onClick={() => handleNavigate('/questionnaires')} className="justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Check Comments
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => handleNavigate('/diary')} className="justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Add Diary Entry
            </Button>
            <Button variant="outline" onClick={() => handleNavigate('/progress')} className="justify-start">
              <Target className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

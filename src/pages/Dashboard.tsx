
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    activeQuestionnaires: 0,
    pendingResponses: 0,
    teamMembers: 0,
    diaryEntries: 0,
    unreadNotifications: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;

    try {
      // Fetch stats based on user role
      if (userProfile.role === 'ceo') {
        // CEO stats
        const [questionnaires, assignments, leaders, diary, notifications] = await Promise.all([
          supabase.from('questionnaires').select('id').eq('created_by', userProfile.id),
          supabase.from('questionnaire_assignments').select('id').is('submitted_at', null),
          supabase.from('leaders').select('id').eq('ceo_id', userProfile.id),
          supabase.from('diary_entries').select('id').eq('user_id', userProfile.id),
          supabase.from('notifications').select('id').eq('recipient_id', userProfile.id).eq('read_flag', false)
        ]);

        setStats({
          activeQuestionnaires: questionnaires.data?.length || 0,
          pendingResponses: assignments.data?.length || 0,
          teamMembers: leaders.data?.length || 0,
          diaryEntries: diary.data?.length || 0,
          unreadNotifications: notifications.data?.length || 0
        });
      } else {
        // Leader stats
        const [assignments, diary, notifications] = await Promise.all([
          supabase.from('questionnaire_assignments').select('id').eq('leader_id', userProfile.id),
          supabase.from('diary_entries').select('id').eq('user_id', userProfile.id),
          supabase.from('notifications').select('id').eq('recipient_id', userProfile.id).eq('read_flag', false)
        ]);

        setStats({
          activeQuestionnaires: assignments.data?.length || 0,
          pendingResponses: assignments.data?.filter((a: any) => !a.submitted_at).length || 0,
          teamMembers: 0,
          diaryEntries: diary.data?.length || 0,
          unreadNotifications: notifications.data?.length || 0
        });
      }

      // Fetch focus areas for upcoming deadlines
      const { data: focusAreas } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('user_id', userProfile.id)
        .not('deadline', 'is', null)
        .gte('deadline', new Date().toISOString().split('T')[0])
        .order('deadline', { ascending: true })
        .limit(3);

      setUpcomingDeadlines(focusAreas || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                  {stats.unreadNotifications > 0 && (
                    <Badge variant="destructive" className="ml-2">{stats.unreadNotifications}</Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {userProfile?.role === 'ceo' ? 'Active Questionnaires' : 'Assigned Tasks'}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeQuestionnaires}</div>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.role === 'ceo' ? 'Created by you' : 'Assigned to you'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingResponses}</div>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.role === 'ceo' ? 'Awaiting submission' : 'To complete'}
                  </p>
                </CardContent>
              </Card>

              {userProfile?.role === 'ceo' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.teamMembers}</div>
                    <p className="text-xs text-muted-foreground">Total leaders</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.diaryEntries}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Focus areas requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No upcoming deadlines</p>
                    </div>
                  ) : (
                    upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{deadline.title}</h4>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(deadline.deadline).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{deadline.progress_percent}%</span>
                          </div>
                          <Progress value={deadline.progress_percent} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="ghost" className="w-full" asChild>
                    <a href="/progress">View All Deadlines</a>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks to get you started</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {userProfile?.role === 'ceo' && (
                      <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
                        <a href="/questionnaires">
                          <FileText className="h-6 w-6" />
                          <span>Create Questionnaire</span>
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
                      <a href="/diary">
                        <BookOpen className="h-6 w-6" />
                        <span>New Diary Entry</span>
                      </a>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
                      <a href="/progress">
                        <TrendingUp className="h-6 w-6" />
                        <span>Add Focus Area</span>
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  totalLeaders: number;
  activeLeaders: number;
  totalQuestionnaires: number;
  publishedQuestionnaires: number;
  completedAssignments: number;
  pendingAssignments: number;
  recentActivities: any[];
}

export const DashboardMetrics = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeaders: 0,
    activeLeaders: 0,
    totalQuestionnaires: 0,
    publishedQuestionnaires: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchMetrics();
    }
  }, [userProfile]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      if (userProfile?.role === 'ceo') {
        // CEO Metrics
        const [leadersData, questionnairesData, assignmentsData, activitiesData] = await Promise.all([
          supabase.from('leaders').select('*').eq('ceo_id', userProfile.id),
          supabase.from('questionnaires').select('*').eq('created_by', userProfile.id),
          supabase.from('questionnaire_assignments').select(`
            *,
            questionnaires!inner(created_by)
          `).eq('questionnaires.created_by', userProfile.id),
          supabase.from('notifications').select('*').eq('recipient_id', userProfile.id).order('created_at', { ascending: false }).limit(5)
        ]);

        const activeLeaders = leadersData.data?.filter(l => l.accepted_at) || [];
        const completedAssignments = assignmentsData.data?.filter(a => a.submitted_at) || [];
        const pendingAssignments = assignmentsData.data?.filter(a => !a.submitted_at) || [];

        setMetrics({
          totalLeaders: leadersData.data?.length || 0,
          activeLeaders: activeLeaders.length,
          totalQuestionnaires: questionnairesData.data?.length || 0,
          publishedQuestionnaires: questionnairesData.data?.filter(q => q.published).length || 0,
          completedAssignments: completedAssignments.length,
          pendingAssignments: pendingAssignments.length,
          recentActivities: activitiesData.data || []
        });
      } else {
        // Leader Metrics
        const [assignmentsData, activitiesData] = await Promise.all([
          supabase.from('questionnaire_assignments').select(`
            *,
            questionnaires(*)
          `).eq('leader_id', userProfile.id),
          supabase.from('notifications').select('*').eq('recipient_id', userProfile.id).order('created_at', { ascending: false }).limit(5)
        ]);

        const completedAssignments = assignmentsData.data?.filter(a => a.submitted_at) || [];
        const pendingAssignments = assignmentsData.data?.filter(a => !a.submitted_at) || [];

        setMetrics({
          totalLeaders: 0,
          activeLeaders: 0,
          totalQuestionnaires: assignmentsData.data?.length || 0,
          publishedQuestionnaires: assignmentsData.data?.length || 0,
          completedAssignments: completedAssignments.length,
          pendingAssignments: pendingAssignments.length,
          recentActivities: activitiesData.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        variant: "destructive",
        title: "Error fetching dashboard data",
        description: "Please try refreshing the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userProfile?.role === 'ceo' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leaders</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalLeaders}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeLeaders} active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questionnaires</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalQuestionnaires}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.publishedQuestionnaires} published
                </p>
              </CardContent>
            </Card>
          </>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.role === 'ceo' ? 'Submissions' : 'Questionnaires'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.role === 'ceo' ? 'Awaiting submission' : 'To complete'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activities</p>
          ) : (
            <div className="space-y-4">
              {metrics.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'questionnaire_assigned' && <FileText className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'leader_joined' && <Users className="h-4 w-4 text-green-500" />}
                    {activity.type === 'submission' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {activity.type === 'feedback' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!activity.read_flag && (
                    <Badge variant="secondary" className="flex-shrink-0">New</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

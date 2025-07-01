
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Target, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardMetricsProps {
  userRole: string;
  metrics: {
    totalQuestionnaires?: number;
    totalLeaders?: number;
    completedTasks?: number;
    pendingTasks?: number;
    focusAreas?: number;
    diaryEntries?: number;
  };
}

export const DashboardMetrics = ({ userRole, metrics }: DashboardMetricsProps) => {
  const navigate = useNavigate();

  if (userRole === 'ceo') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questionnaires</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQuestionnaires || 0}</div>
            <p className="text-xs text-muted-foreground">Published questionnaires</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeaders || 0}</div>
            <p className="text-xs text-muted-foreground">Active leaders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Areas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.focusAreas || 0}</div>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.diaryEntries || 0}</div>
            <p className="text-xs text-muted-foreground">Diary entries</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Leader dashboard
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/questionnaires')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingTasks || 0}</div>
          <p className="text-xs text-muted-foreground">Pending questionnaires</p>
          <Button variant="link" className="p-0 h-auto mt-2 text-xs">
            View Tasks →
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completedTasks || 0}</div>
          <p className="text-xs text-muted-foreground">Submitted questionnaires</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Focus Areas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.focusAreas || 0}</div>
          <p className="text-xs text-muted-foreground">Active goals</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.diaryEntries || 0}</div>
          <p className="text-xs text-muted-foreground">Diary entries</p>
        </CardContent>
      </Card>
    </div>
  );
};

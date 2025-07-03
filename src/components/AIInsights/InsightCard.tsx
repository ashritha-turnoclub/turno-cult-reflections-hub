
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InsightCardProps {
  insight: {
    summary: string;
    keyMetrics?: {
      progressScore: number;
      completionRate: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    strengths?: string[];
    concerns?: string[];
    monthlyTrend?: {
      direction: 'IMPROVING' | 'DECLINING' | 'STABLE';
      insight: string;
    };
    analytics?: {
      totalFocusAreas: number;
      completedFocusAreas: number;
      avgProgress: number;
      recentDiaryEntries: number;
      submittedQuestionnaires: number;
      totalQuestionnaires: number;
      overdueItems: number;
    };
  };
}

const InsightCard = ({ insight }: InsightCardProps) => {
  // Provide fallback values for keyMetrics
  const keyMetrics = insight.keyMetrics || {
    progressScore: 0,
    completionRate: 0,
    riskLevel: 'LOW' as const
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'default';
      default: return 'secondary';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'IMPROVING': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'DECLINING': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'STABLE': return <Minus className="h-4 w-4 text-yellow-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Executive Summary</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {insight.summary}
            </CardDescription>
          </div>
          <Badge variant={getRiskColor(keyMetrics.riskLevel)}>
            {keyMetrics.riskLevel} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress Score</span>
              <span className="text-sm text-gray-600">{keyMetrics.progressScore}%</span>
            </div>
            <Progress value={keyMetrics.progressScore} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-gray-600">{keyMetrics.completionRate}%</span>
            </div>
            <Progress value={keyMetrics.completionRate} className="h-2" />
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon(insight.monthlyTrend?.direction || 'STABLE')}
            <div>
              <div className="text-sm font-medium">Monthly Trend</div>
              <div className="text-xs text-gray-600">{insight.monthlyTrend?.direction || 'STABLE'}</div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        {insight.analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{insight.analytics.totalFocusAreas}</div>
              <div className="text-xs text-gray-600">Focus Areas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{insight.analytics.completedFocusAreas}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{insight.analytics.recentDiaryEntries}</div>
              <div className="text-xs text-gray-600">Diary Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{insight.analytics.overdueItems}</div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
          </div>
        )}

        {/* Strengths & Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insight.strengths && insight.strengths.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {insight.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {insight.concerns && insight.concerns.length > 0 && (
            <div>
              <h4 className="font-medium text-amber-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Areas of Concern
              </h4>
              <ul className="space-y-1">
                {insight.concerns.map((concern, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Monthly Trend Insight */}
        {insight.monthlyTrend?.insight && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Monthly Trend Analysis
            </h4>
            <p className="text-sm text-gray-700">{insight.monthlyTrend.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightCard;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, MessageSquare, Target } from "lucide-react";

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  timeline: string;
  category: 'GOAL_SETTING' | 'TIME_MANAGEMENT' | 'COMMUNICATION' | 'STRATEGY';
}

interface RecommendationsCardProps {
  recommendations?: Recommendation[];
  blockers?: string[];
  nextSteps?: string[];
}

const RecommendationsCard = ({ recommendations, blockers, nextSteps }: RecommendationsCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GOAL_SETTING': return <Target className="h-4 w-4" />;
      case 'TIME_MANAGEMENT': return <Clock className="h-4 w-4" />;
      case 'COMMUNICATION': return <MessageSquare className="h-4 w-4" />;
      case 'STRATEGY': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (!recommendations && !blockers && !nextSteps) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(rec.category)}
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{rec.category.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-gray-500">{rec.timeline}</span>
                  </div>
                  <p className="text-sm text-gray-800">{rec.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockers */}
      {blockers && blockers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Identified Blockers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockers.map((blocker, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-800">{blocker}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Clock className="h-5 w-5 mr-2" />
              Immediate Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">
                    {index + 1}
                  </div>
                  <p className="text-sm text-green-800">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsCard;

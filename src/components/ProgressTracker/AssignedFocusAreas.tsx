
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, CheckSquare, Users, Eye, Edit, Tag } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
  title: string;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
}

interface Collaborator {
  user_id: string;
  role: 'ceo' | 'leader';
  permission: 'view' | 'edit';
}

interface AssignedFocusArea {
  id: string;
  title: string;
  description: string | null;
  quarter: string | null;
  year: number | null;
  deadline: string | null;
  progress_percent: number;
  checklist: ActionItem[];
  tags: string[];
  collaborators: Collaborator[];
  created_at: string;
  user_id: string;
  owner_name?: string;
}

export const AssignedFocusAreas = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [assignedAreas, setAssignedAreas] = useState<AssignedFocusArea[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      fetchAssignedFocusAreas();
    }
  }, [userProfile]);

  const fetchAssignedFocusAreas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('focus_areas')
        .select(`
          *,
          users!focus_areas_user_id_fkey(name)
        `)
        .contains('collaborators', [{ user_id: userProfile?.id }]);

      if (error) throw error;

      const transformedAreas: AssignedFocusArea[] = (data || []).map(area => ({
        ...area,
        checklist: Array.isArray(area.checklist) 
          ? area.checklist.map((item: any) => 
              typeof item === 'string' 
                ? { title: item, completed: false }
                : item
            )
          : [],
        tags: Array.isArray(area.tags) ? area.tags : [],
        collaborators: Array.isArray(area.collaborators) ? area.collaborators : [],
        owner_name: area.users?.name || 'Unknown'
      }));

      setAssignedAreas(transformedAreas);
    } catch (error) {
      console.error('Error fetching assigned focus areas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assigned focus areas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateActionItem = async (areaId: string, itemIndex: number, field: keyof ActionItem, value: string | boolean) => {
    try {
      const area = assignedAreas.find(a => a.id === areaId);
      if (!area) return;

      const userCollaboration = area.collaborators.find(c => c.user_id === userProfile?.id);
      if (!userCollaboration || userCollaboration.permission !== 'edit') {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have edit permission for this focus area.",
        });
        return;
      }

      const updatedChecklist = area.checklist.map((item, i) => 
        i === itemIndex 
          ? { 
              ...item, 
              [field]: value,
              ...(field === 'completed' && value === true ? { completed_at: new Date().toISOString() } : {})
            }
          : item
      );

      // Calculate new progress
      const completedItems = updatedChecklist.filter(item => item.completed).length;
      const totalItems = updatedChecklist.length;
      const newProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const { error } = await supabase
        .from('focus_areas')
        .update({ 
          checklist: updatedChecklist,
          progress_percent: newProgress
        })
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Action item updated successfully.",
      });

      fetchAssignedFocusAreas();
    } catch (error) {
      console.error('Error updating action item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update action item.",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (assignedAreas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned focus areas</h3>
          <p className="text-gray-600 text-center">
            You haven't been assigned to any focus areas yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {assignedAreas.map((area) => {
        const userCollaboration = area.collaborators.find(c => c.user_id === userProfile?.id);
        const canEdit = userCollaboration?.permission === 'edit';
        const completedItems = area.checklist.filter(item => item.completed).length;
        const totalItems = area.checklist.length;

        return (
          <Card key={area.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    {area.title}
                    <Badge variant="outline" className="ml-2">
                      {canEdit ? <Edit className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {canEdit ? 'Edit Access' : 'View Only'}
                    </Badge>
                  </CardTitle>
                  {area.description && (
                    <CardDescription className="mt-2">
                      {area.description}
                    </CardDescription>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge variant="secondary">Owner: {area.owner_name}</Badge>
                    {area.quarter && area.year && (
                      <Badge variant="outline">{area.quarter} {area.year}</Badge>
                    )}
                    {area.deadline && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(area.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {totalItems > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        {completedItems}/{totalItems} completed
                      </div>
                    )}
                  </div>
                  {area.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {area.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{area.progress_percent}%</span>
                  </div>
                  <Progress value={area.progress_percent} className="h-2" />
                </div>
                
                {area.checklist.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {area.checklist.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => canEdit && updateActionItem(area.id, index, 'completed', checked as boolean)}
                              disabled={!canEdit}
                            />
                            <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 ml-6">
                            {item.deadline && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {new Date(item.deadline).toLocaleDateString()}
                              </div>
                            )}
                            {item.completed && item.completed_at && (
                              <span className="text-sm text-green-600">
                                Completed on {new Date(item.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckSquare, Users, Eye, Edit, Tag, Clock } from "lucide-react";
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
      
      // First get all focus areas where user is not the owner
      const { data: allAreas, error } = await supabase
        .from('focus_areas')
        .select(`
          *,
          users!focus_areas_user_id_fkey(name)
        `)
        .neq('user_id', userProfile?.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('All areas fetched:', allAreas?.length || 0);

      // Filter and transform areas where user is a collaborator
      const transformedAreas: AssignedFocusArea[] = (allAreas || [])
        .map(area => {
          const areaWithNewFields = area as any;
          
          let checklist: ActionItem[] = [];
          let tags: string[] = [];
          let collaborators: Collaborator[] = [];

          // Parse checklist
          if (areaWithNewFields.checklist) {
            try {
              const parsed = typeof areaWithNewFields.checklist === 'string' 
                ? JSON.parse(areaWithNewFields.checklist) 
                : areaWithNewFields.checklist;
              checklist = Array.isArray(parsed) 
                ? parsed.map((item: any) => 
                    typeof item === 'string' 
                      ? { title: item, completed: false }
                      : item
                  )
                : [];
            } catch (e) {
              console.error('Error parsing checklist:', e);
              checklist = [];
            }
          }

          // Parse tags
          if (areaWithNewFields.tags) {
            try {
              const parsed = typeof areaWithNewFields.tags === 'string' 
                ? JSON.parse(areaWithNewFields.tags) 
                : areaWithNewFields.tags;
              tags = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.error('Error parsing tags:', e);
              tags = [];
            }
          }

          // Parse collaborators
          if (areaWithNewFields.collaborators) {
            try {
              const parsed = typeof areaWithNewFields.collaborators === 'string' 
                ? JSON.parse(areaWithNewFields.collaborators) 
                : areaWithNewFields.collaborators;
              collaborators = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.error('Error parsing collaborators:', e);
              collaborators = [];
            }
          }

          return {
            ...area,
            checklist,
            tags,
            collaborators,
            owner_name: areaWithNewFields.users?.name || 'Unknown'
          };
        })
        .filter(area => {
          // Check if current user is in collaborators
          const isCollaborator = area.collaborators.some(collaborator => 
            collaborator.user_id === userProfile?.id
          );
          console.log(`Area "${area.title}" - User ${userProfile?.id} is collaborator:`, isCollaborator);
          return isCollaborator;
        });

      console.log('Assigned areas after filtering:', transformedAreas.length);
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
          checklist: JSON.stringify(updatedChecklist),
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
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (assignedAreas.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No assigned focus areas</h3>
          <p className="text-gray-500 max-w-md">
            You haven't been assigned to any focus areas yet. Focus areas need to have collaborators added by their owners to appear here.
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
          <Card key={area.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl text-gray-800">{area.title}</CardTitle>
                    <Badge variant={canEdit ? "default" : "secondary"} className="text-xs">
                      {canEdit ? (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit Access
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          View Only
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  {area.description && (
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {area.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Users className="h-3 w-3 mr-1" />
                      Owner: {area.owner_name}
                    </Badge>
                    
                    {area.quarter && area.year && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {area.quarter} {area.year}
                      </Badge>
                    )}
                    
                    {area.deadline && (
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {new Date(area.deadline).toLocaleDateString()}
                      </div>
                    )}
                    
                    {totalItems > 0 && (
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        {completedItems}/{totalItems} completed
                      </div>
                    )}
                  </div>
                  
                  {area.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {area.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
                    <span>Progress</span>
                    <span className="text-lg">{area.progress_percent}%</span>
                  </div>
                  <Progress value={area.progress_percent} className="h-3" />
                </div>
                
                {area.checklist.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Action Items
                    </h4>
                    <div className="space-y-3">
                      {area.checklist.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => canEdit && updateActionItem(area.id, index, 'completed', checked as boolean)}
                              disabled={!canEdit}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <span className={`block ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {item.title}
                              </span>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                {item.deadline && (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due: {new Date(item.deadline).toLocaleDateString()}
                                  </div>
                                )}
                                {item.completed && item.completed_at && (
                                  <span className="text-green-600 font-medium">
                                    ✓ Completed {new Date(item.completed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
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

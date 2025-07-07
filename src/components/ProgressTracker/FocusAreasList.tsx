import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Calendar, CheckSquare, Tag, Check } from "lucide-react";
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

interface FocusArea {
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
  updated_at: string;
  user_id: string;
}

interface FocusAreasListProps {
  focusAreas: FocusArea[];
  onEdit: (area: FocusArea) => void;
  onDelete: (areaId: string) => void;
  onRefresh: () => void;
}

export const FocusAreasList = ({ focusAreas, onEdit, onDelete, onRefresh }: FocusAreasListProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const updateActionItem = async (areaId: string, itemIndex: number, field: keyof ActionItem, value: string | boolean) => {
    try {
      const area = focusAreas.find(a => a.id === areaId);
      if (!area) return;

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

      onRefresh();
    } catch (error) {
      console.error('Error updating action item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update action item.",
      });
    }
  };

  if (focusAreas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No focus areas found</h3>
          <p className="text-gray-600 text-center">
            Create your first focus area to start tracking your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {focusAreas.map((area) => {
        const completedItems = area.checklist.filter(item => item.completed).length;
        const totalItems = area.checklist.length;

        return (
          <Card key={area.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{area.title}</CardTitle>
                  {area.description && (
                    <CardDescription className="mt-2">
                      {area.description}
                    </CardDescription>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(area.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                              onCheckedChange={(checked) => updateActionItem(area.id, index, 'completed', checked as boolean)}
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
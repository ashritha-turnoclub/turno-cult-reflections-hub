
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Target, Calendar, Trash2, Edit, Save, X } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FocusArea {
  id?: string;
  title: string;
  description: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  deadline: string;
  progress_percent: number;
  checklist: string[];
}

const ProgressTracker = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState<FocusArea | undefined>();
  const [formData, setFormData] = useState<FocusArea>({
    title: '',
    description: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    deadline: '',
    progress_percent: 0,
    checklist: ['']
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchFocusAreas();
    }
  }, [userProfile]);

  const fetchFocusAreas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAreas = data?.map(area => ({
        ...area,
        checklist: area.checklist || []
      })) || [];

      setFocusAreas(formattedAreas);
    } catch (error) {
      console.error('Error fetching focus areas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load focus areas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingArea(undefined);
    setFormData({
      title: '',
      description: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      deadline: '',
      progress_percent: 0,
      checklist: ['']
    });
    setShowForm(true);
  };

  const handleEdit = (area: FocusArea) => {
    setEditingArea(area);
    setFormData({
      ...area,
      checklist: area.checklist && area.checklist.length > 0 ? area.checklist : ['']
    });
    setShowForm(true);
  };

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, '']
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => i === index ? value : item)
    }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a title for your focus area.",
      });
      return false;
    }

    if (!formData.deadline) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please set a deadline.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const areaData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        quarter: formData.quarter,
        year: formData.year,
        deadline: formData.deadline,
        progress_percent: formData.progress_percent,
        checklist: formData.checklist.filter(item => item.trim() !== ''),
        user_id: userProfile?.id
      };

      if (editingArea?.id) {
        // Update existing area
        const { error } = await supabase
          .from('focus_areas')
          .update(areaData)
          .eq('id', editingArea.id);

        if (error) throw error;

        toast({
          title: "Focus Area Updated",
          description: "Your focus area has been updated successfully.",
        });
      } else {
        // Create new area
        const { error } = await supabase
          .from('focus_areas')
          .insert(areaData);

        if (error) throw error;

        toast({
          title: "Focus Area Created",
          description: "Your focus area has been created successfully.",
        });
      }

      setShowForm(false);
      setEditingArea(undefined);
      fetchFocusAreas();
    } catch (error) {
      console.error('Error saving focus area:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save focus area. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFocusArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this focus area?')) return;

    try {
      const { error } = await supabase
        .from('focus_areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: "Focus Area Deleted",
        description: "Focus area has been deleted successfully.",
      });

      fetchFocusAreas();
    } catch (error) {
      console.error('Error deleting focus area:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete focus area.",
      });
    }
  };

  const updateProgress = async (areaId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('focus_areas')
        .update({ progress_percent: newProgress })
        .eq('id', areaId);

      if (error) throw error;

      setFocusAreas(prev => 
        prev.map(area => 
          area.id === areaId ? { ...area, progress_percent: newProgress } : area
        )
      );

      toast({
        title: "Progress Updated",
        description: `Progress updated to ${newProgress}%`,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress.",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
                  <p className="text-gray-600">Track your focus areas and goals</p>
                </div>
              </div>
              
              {!showForm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Focus Area
                </Button>
              )}
            </div>

            {showForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingArea ? 'Edit Focus Area' : 'New Focus Area'}</CardTitle>
                  <CardDescription>Set up a new area to focus on and track your progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Leadership Development"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Target Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quarter">Quarter</Label>
                      <Select
                        value={formData.quarter}
                        onValueChange={(value: 'Q1' | 'Q2' | 'Q3' | 'Q4') => 
                          setFormData(prev => ({ ...prev, quarter: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progress">Progress %</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress_percent}
                        onChange={(e) => setFormData(prev => ({ ...prev, progress_percent: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your focus area and goals..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Action Items Checklist</Label>
                    {formData.checklist.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Add an action item..."
                          value={item}
                          onChange={(e) => updateChecklistItem(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeChecklistItem(index)}
                          disabled={formData.checklist.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={handleSubmit} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Focus Area"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {loading && focusAreas.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </CardContent>
                  </Card>
                ) : focusAreas.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No focus areas yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first focus area to start tracking your progress
                      </p>
                      <Button onClick={handleCreateNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Focus Area
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  focusAreas.map((area) => (
                    <Card key={area.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{area.title}</CardTitle>
                            <div className="flex items-center space-x-3 mt-2">
                              <Badge variant="outline">{area.quarter} {area.year}</Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {new Date(area.deadline).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(area)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteFocusArea(area.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {area.description && (
                          <p className="text-gray-700">{area.description}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{area.progress_percent}%</span>
                          </div>
                          <Progress value={area.progress_percent} className="h-2" />
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={area.progress_percent}
                              onChange={(e) => updateProgress(area.id!, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                        
                        {area.checklist && area.checklist.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Action Items:</h4>
                            <div className="space-y-2">
                              {area.checklist.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Checkbox />
                                  <span className="text-sm text-gray-700">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProgressTracker;

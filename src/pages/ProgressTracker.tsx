import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Edit, Trash2, Calendar, CheckSquare, Tag, X, Users } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/Notifications/NotificationBell';
import { SearchSortHeader } from '@/components/ui/search-sort-header';
import { useSearch } from '@/hooks/useSearch';
import { CollaboratorSelector } from '@/components/ProgressTracker/CollaboratorSelector';
import { AssignedFocusAreas } from '@/components/ProgressTracker/AssignedFocusAreas';

type QuarterType = 'Q1' | 'Q2' | 'Q3' | 'Q4';

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
  quarter: QuarterType | null;
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

const defaultTags = [
  'Sales', 'Marketing', 'Business', 'Lending', 'Battery', 
  'Credit Operations', 'Collections', 'Finance', 'HR', 'Operations'
];

const ProgressTracker = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<FocusArea | null>(null);
  const [activeTab, setActiveTab] = useState('my-areas');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quarter: '' as QuarterType | '',
    year: new Date().getFullYear(),
    deadline: '',
    progress_percent: 0,
    checklist: [{ title: '', completed: false }] as ActionItem[],
    tags: [] as string[],
    collaborators: [] as Collaborator[]
  });

  const sortOptions = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'quarter-asc', label: 'Quarter (Q1-Q4)' },
    { value: 'quarter-desc', label: 'Quarter (Q4-Q1)' },
    { value: 'year-asc', label: 'Year (Ascending)' },
    { value: 'year-desc', label: 'Year (Descending)' },
    { value: 'deadline-asc', label: 'Deadline (Soonest)' },
    { value: 'deadline-desc', label: 'Deadline (Latest)' },
    { value: 'created_at-desc', label: 'Created (Newest)' },
    { value: 'created_at-asc', label: 'Created (Oldest)' },
    { value: 'tags-asc', label: 'Tags (A-Z)' },
    { value: 'tags-desc', label: 'Tags (Z-A)' }
  ];

  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredData: filteredFocusAreas
  } = useSearch({
    data: focusAreas,
    searchFields: ['title', 'description', 'tags'],
    sortOptions,
    defaultSort: 'created_at-desc'
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

      const transformedAreas: FocusArea[] = (data || []).map(area => {
        // Cast to any to access new fields that aren't in generated types yet
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
          collaborators
        };
      });

      setFocusAreas(transformedAreas);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id || !formData.title.trim()) return;

    try {
      setLoading(true);
      
      // Calculate progress based on completed action items
      const completedItems = formData.checklist.filter(item => item.completed).length;
      const totalItems = formData.checklist.length;
      const calculatedProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : formData.progress_percent;
      
      const focusAreaData = {
        user_id: userProfile.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        quarter: formData.quarter || null,
        year: formData.year,
        deadline: formData.deadline || null,
        progress_percent: calculatedProgress,
        checklist: JSON.stringify(formData.checklist.filter(item => item.title.trim())),
        tags: JSON.stringify(formData.tags),
        collaborators: JSON.stringify(formData.collaborators)
      };

      if (editingArea) {
        const { error } = await supabase
          .from('focus_areas')
          .update(focusAreaData)
          .eq('id', editingArea.id);

        if (error) throw error;

        toast({
          title: "Focus Area Updated",
          description: "Your focus area has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('focus_areas')
          .insert([focusAreaData]);

        if (error) throw error;

        toast({
          title: "Focus Area Created",
          description: "Your new focus area has been created successfully.",
        });
      }

      resetForm();
      setShowDialog(false);
      fetchFocusAreas();
    } catch (error) {
      console.error('Error saving focus area:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save focus area.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quarter: '',
      year: new Date().getFullYear(),
      deadline: '',
      progress_percent: 0,
      checklist: [{ title: '', completed: false }],
      tags: [],
      collaborators: []
    });
    setEditingArea(null);
  };

  const handleEdit = (area: FocusArea) => {
    setEditingArea(area);
    setFormData({
      title: area.title,
      description: area.description || '',
      quarter: area.quarter || '',
      year: area.year || new Date().getFullYear(),
      deadline: area.deadline || '',
      progress_percent: area.progress_percent,
      checklist: area.checklist.length > 0 ? area.checklist : [{ title: '', completed: false }],
      tags: area.tags,
      collaborators: area.collaborators
    });
    setShowDialog(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this focus area?')) return;

    try {
      const { error } = await supabase
        .from('focus_areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      toast({
        title: "Focus Area Deleted",
        description: "The focus area has been deleted successfully.",
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

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { title: '', completed: false }]
    }));
  };

  const updateActionItem = (index: number, field: keyof ActionItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: value,
              ...(field === 'completed' && value === true ? { completed_at: new Date().toISOString() } : {})
            }
          : item
      )
    }));
  };

  const removeActionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
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
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Target className="h-8 w-8 mr-3 text-purple-600" />
                    Progress Tracker
                  </h1>
                  <p className="text-gray-600">Track your goals, focus areas, and progress</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Focus Area
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingArea ? 'Edit Focus Area' : 'Create New Focus Area'}
                      </DialogTitle>
                      <DialogDescription>
                        Define your goals and track your progress with actionable items.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter focus area title"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="progress">Progress (%)</Label>
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
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your focus area and objectives"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => removeTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <Select onValueChange={addTag}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add tags" />
                          </SelectTrigger>
                          <SelectContent>
                            {defaultTags.filter(tag => !formData.tags.includes(tag)).map(tag => (
                              <SelectItem key={tag} value={tag}>
                                <div className="flex items-center">
                                  <Tag className="h-4 w-4 mr-2" />
                                  {tag}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quarter">Quarter</Label>
                          <Select value={formData.quarter} onValueChange={(value: QuarterType) => setFormData(prev => ({ ...prev, quarter: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quarter" />
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
                            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Action Items</Label>
                          <Button type="button" onClick={addActionItem} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </div>
                        
                        {formData.checklist.map((item, index) => (
                          <div key={index} className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={(checked) => updateActionItem(index, 'completed', checked as boolean)}
                              />
                              <Input
                                value={item.title}
                                onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                                placeholder="Enter action item"
                                className="flex-1"
                              />
                              {formData.checklist.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeActionItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-6">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <Input
                                type="date"
                                value={item.deadline || ''}
                                onChange={(e) => updateActionItem(index, 'deadline', e.target.value)}
                                placeholder="Set deadline"
                                className="w-40"
                              />
                              {item.completed && item.completed_at && (
                                <span className="text-sm text-green-600">
                                  Completed on {new Date(item.completed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <CollaboratorSelector
                        collaborators={formData.collaborators}
                        onCollaboratorsChange={(collaborators) => setFormData(prev => ({ ...prev, collaborators }))}
                      />
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? "Saving..." : editingArea ? "Update Focus Area" : "Create Focus Area"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-areas">My Focus Areas</TabsTrigger>
                <TabsTrigger value="assigned-areas">Assigned Focus Areas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-areas" className="space-y-4">
                <SearchSortHeader
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  sortOptions={sortOptions}
                  searchPlaceholder="Search focus areas..."
                />

                <div className="grid gap-6">
                  {loading && focusAreas.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </CardContent>
                    </Card>
                  ) : focusAreas.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Target className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No focus areas yet</h3>
                        <p className="text-gray-600 text-center mb-4">
                          Create your first focus area to start tracking your progress and goals.
                        </p>
                        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Focus Area
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredFocusAreas.map((area) => {
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
                                  {area.collaborators.length > 0 && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Users className="h-4 w-4 mr-1" />
                                      {area.collaborators.length} collaborator{area.collaborators.length !== 1 ? 's' : ''}
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
                                  onClick={() => handleEdit(area)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(area.id)}
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
                                  <div className="space-y-1">
                                    {area.checklist.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                                        <div className="flex items-center space-x-2">
                                          <Checkbox checked={item.completed} disabled />
                                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                          {item.deadline && (
                                            <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>
                                          )}
                                          {item.completed && item.completed_at && (
                                            <span className="text-green-600">
                                              ✓ {new Date(item.completed_at).toLocaleDateString()}
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
                    })
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="assigned-areas">
                <AssignedFocusAreas />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProgressTracker;

import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Calendar, Edit, Trash2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SearchSortHeader } from "@/components/ui/search-sort-header";
import { useSearch } from '@/hooks/useSearch';

interface FocusArea {
  id: string;
  title: string;
  description: string | null;
  progress_percent: number;
  deadline: string | null;
  quarter: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
}

const ProgressTracker = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [isAddingFocus, setIsAddingFocus] = useState(false);
  const [editingFocus, setEditingFocus] = useState<FocusArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [newFocus, setNewFocus] = useState({
    title: '',
    description: '',
    progress_percent: 0,
    deadline: '',
    quarter: '',
    year: new Date().getFullYear()
  });

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    filteredAndSortedData,
  } = useSearch(
    focusAreas,
    ['title', 'description', 'quarter'] as (keyof FocusArea)[],
    'created_at' as keyof FocusArea,
    'desc'
  );

  useEffect(() => {
    if (userProfile) {
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
      setFocusAreas(data || []);
    } catch (error) {
      console.error('Error fetching focus areas:', error);
      toast({
        variant: "destructive",
        title: "Error fetching focus areas",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const focusData = {
        user_id: userProfile?.id,
        title: newFocus.title,
        description: newFocus.description || null,
        progress_percent: newFocus.progress_percent,
        deadline: newFocus.deadline || null,
        quarter: newFocus.quarter || null,
        year: newFocus.year
      };

      if (editingFocus) {
        const { error } = await supabase
          .from('focus_areas')
          .update(focusData)
          .eq('id', editingFocus.id);

        if (error) throw error;

        toast({
          title: "Focus area updated",
          description: "Your focus area has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('focus_areas')
          .insert([focusData]);

        if (error) throw error;

        toast({
          title: "Focus area created",
          description: "Your new focus area has been added successfully.",
        });
      }
      
      setNewFocus({
        title: '',
        description: '',
        progress_percent: 0,
        deadline: '',
        quarter: '',
        year: new Date().getFullYear()
      });
      setIsAddingFocus(false);
      setEditingFocus(null);
      fetchFocusAreas();
    } catch (error) {
      console.error('Error saving focus area:', error);
      toast({
        variant: "destructive",
        title: "Error saving focus area",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (focus: FocusArea) => {
    setEditingFocus(focus);
    setNewFocus({
      title: focus.title,
      description: focus.description || '',
      progress_percent: focus.progress_percent,
      deadline: focus.deadline || '',
      quarter: focus.quarter || '',
      year: focus.year || new Date().getFullYear()
    });
    setIsAddingFocus(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this focus area?')) return;

    try {
      const { error } = await supabase
        .from('focus_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Focus area deleted",
        description: "The focus area has been deleted successfully.",
      });

      fetchFocusAreas();
    } catch (error) {
      console.error('Error deleting focus area:', error);
      toast({
        variant: "destructive",
        title: "Error deleting focus area",
        description: "Please try again.",
      });
    }
  };

  const sortOptions = [
    { field: 'created_at', label: 'Date Created' },
    { field: 'title', label: 'Title' },
    { field: 'progress_percent', label: 'Progress' },
    { field: 'deadline', label: 'Deadline' },
    { field: 'quarter', label: 'Quarter' }
  ];

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
                  <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
                  <p className="text-gray-600">Track your goals and measure your progress</p>
                </div>
              </div>
              
              <Dialog open={isAddingFocus} onOpenChange={(open) => {
                setIsAddingFocus(open);
                if (!open) {
                  setEditingFocus(null);
                  setNewFocus({
                    title: '',
                    description: '',
                    progress_percent: 0,
                    deadline: '',
                    quarter: '',
                    year: new Date().getFullYear()
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Focus Area
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingFocus ? 'Edit Focus Area' : 'Add New Focus Area'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingFocus 
                        ? 'Update your focus area details and progress.'
                        : 'Create a new focus area to track your progress and goals.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newFocus.title}
                        onChange={(e) => setNewFocus({...newFocus, title: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newFocus.description}
                        onChange={(e) => setNewFocus({...newFocus, description: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="progress">Progress ({newFocus.progress_percent}%)</Label>
                        <Input
                          id="progress"
                          type="number"
                          min="0"
                          max="100"
                          value={newFocus.progress_percent}
                          onChange={(e) => setNewFocus({...newFocus, progress_percent: parseInt(e.target.value) || 0})}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newFocus.deadline}
                          onChange={(e) => setNewFocus({...newFocus, deadline: e.target.value})}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quarter">Quarter</Label>
                        <Select
                          value={newFocus.quarter}
                          onValueChange={(value) => setNewFocus({...newFocus, quarter: value})}
                          disabled={loading}
                        >
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
                          value={newFocus.year}
                          onChange={(e) => setNewFocus({...newFocus, year: parseInt(e.target.value) || new Date().getFullYear()})}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Saving..." : (editingFocus ? "Update" : "Create")}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingFocus(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <SearchSortHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortField={sortField as string}
              sortOrder={sortOrder}
              onSort={(field) => handleSort(field as keyof FocusArea)}
              sortOptions={sortOptions}
              placeholder="Search focus areas by title, description, or quarter..."
            />

            <div className="grid gap-6">
              {loading && focusAreas.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </CardContent>
                </Card>
              ) : filteredAndSortedData.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No focus areas found' : 'No focus areas yet'}
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search terms or filters'
                        : 'Start tracking your progress by creating your first focus area'
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsAddingFocus(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Focus Area
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredAndSortedData.map((focus) => (
                  <Card key={focus.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{focus.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {focus.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {focus.quarter && focus.year && (
                            <Badge variant="outline">
                              {focus.quarter} {focus.year}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(focus)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(focus.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{focus.progress_percent}%</span>
                        </div>
                        <Progress value={focus.progress_percent} className="h-2" />
                      </div>
                      
                      {focus.deadline && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Deadline: {new Date(focus.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProgressTracker;

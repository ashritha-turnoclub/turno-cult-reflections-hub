
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Calendar, FileText, CheckSquare, Tag, Clock, BookOpen } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SearchSortHeader } from '@/components/ui/search-sort-header';
import { useSearch, SortOption } from '@/hooks/useSearch';

interface ActionItem {
  title: string;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
}

interface DiaryEntry {
  id: string;
  title: string;
  category: string | null;
  notes: string;
  timeline: string | null;
  checklist: ActionItem[];
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DiaryListProps {
  onEditEntry: (entry: DiaryEntry) => void;
  refreshKey: number;
  sortOptions: SortOption[];
}

export const DiaryList = ({ onEditEntry, refreshKey, sortOptions }: DiaryListProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredData: filteredEntries
  } = useSearch({
    data: entries,
    searchFields: ['title', 'notes', 'tags'],
    sortOptions,
    defaultSort: 'created_at-desc'
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchEntries();
    }
  }, [userProfile, refreshKey]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedEntries: DiaryEntry[] = (data || []).map(entry => {
        const entryWithNewFields = entry as any;
        
        let checklist: ActionItem[] = [];
        let tags: string[] = [];

        // Parse checklist
        if (entryWithNewFields.checklist) {
          try {
            const parsed = typeof entryWithNewFields.checklist === 'string' 
              ? JSON.parse(entryWithNewFields.checklist) 
              : entryWithNewFields.checklist;
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
        if (entryWithNewFields.tags) {
          try {
            const parsed = typeof entryWithNewFields.tags === 'string' 
              ? JSON.parse(entryWithNewFields.tags) 
              : entryWithNewFields.tags;
            tags = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error('Error parsing tags:', e);
            tags = [];
          }
        }

        return {
          ...entry,
          checklist,
          tags
        };
      });

      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load diary entries.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateActionItem = async (entryId: string, itemIndex: number, field: keyof ActionItem, value: string | boolean) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      const updatedChecklist = entry.checklist.map((item, i) => 
        i === itemIndex 
          ? { 
              ...item, 
              [field]: value,
              ...(field === 'completed' && value === true ? { completed_at: new Date().toISOString() } : {})
            }
          : item
      );

      const { error } = await supabase
        .from('diary_entries')
        .update({ 
          checklist: JSON.stringify(updatedChecklist)
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Action item updated successfully.",
      });

      fetchEntries();
    } catch (error) {
      console.error('Error updating action item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update action item.",
      });
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Entry Deleted",
        description: "The diary entry has been deleted successfully.",
      });

      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete entry.",
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

  return (
    <div className="space-y-6">
      <SearchSortHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        searchPlaceholder="Search diary entries..."
      />
      
      {filteredEntries.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No diary entries found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Create your first diary entry to start documenting your thoughts and experiences.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredEntries.map((entry) => {
            const completedItems = entry.checklist.filter(item => item.completed).length;
            const totalItems = entry.checklist.length;
            
            return (
              <Card key={entry.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <CardTitle className="text-xl text-gray-800">{entry.title}</CardTitle>
                      
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {entry.notes.substring(0, 200)}
                        {entry.notes.length > 200 && '...'}
                      </CardDescription>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {entry.category && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {entry.category}
                          </Badge>
                        )}
                        
                        {entry.timeline && (
                          <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(entry.timeline).toLocaleDateString()}
                          </div>
                        )}
                        
                        {totalItems > 0 && (
                          <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {completedItems}/{totalItems} completed
                          </div>
                        )}
                      </div>
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditEntry(entry)}
                        className="hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {entry.checklist.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Action Items
                      </h4>
                      <div className="space-y-3">
                        {entry.checklist.slice(0, 3).map((item, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={(checked) => updateActionItem(entry.id, index, 'completed', checked as boolean)}
                                className="mt-1"
                              />
                              <div className="flex-1 space-y-1">
                                <span className={`block text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {item.title}
                                </span>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
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
                        {entry.checklist.length > 3 && (
                          <div className="text-sm text-gray-500 text-center py-2">
                            +{entry.checklist.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

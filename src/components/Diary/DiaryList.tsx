
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, FileText, CheckSquare, Tag } from "lucide-react";
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
        let checklist: ActionItem[] = [];
        let tags: string[] = [];

        // Parse checklist
        if (entry.checklist) {
          try {
            const parsed = typeof entry.checklist === 'string' 
              ? JSON.parse(entry.checklist) 
              : entry.checklist;
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
        if (entry.tags) {
          try {
            const parsed = typeof entry.tags === 'string' 
              ? JSON.parse(entry.tags) 
              : entry.tags;
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SearchSortHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        searchPlaceholder="Search diary entries..."
      />
      
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No diary entries found</h3>
            <p className="text-gray-600">Create your first diary entry to get started.</p>
          </CardContent>
        </Card>
      ) : (
        filteredEntries.map((entry) => {
          const completedItems = entry.checklist.filter(item => item.completed).length;
          const totalItems = entry.checklist.length;
          
          return (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {entry.notes.substring(0, 150)}
                      {entry.notes.length > 150 && '...'}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {entry.category && (
                        <Badge variant="outline">{entry.category}</Badge>
                      )}
                      {entry.timeline && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(entry.timeline).toLocaleDateString()}
                        </div>
                      )}
                      {totalItems > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CheckSquare className="h-4 w-4 mr-1" />
                          {completedItems}/{totalItems} completed
                        </div>
                      )}
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map(tag => (
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
                      onClick={() => onEditEntry(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })
      )}
    </div>
  );
};

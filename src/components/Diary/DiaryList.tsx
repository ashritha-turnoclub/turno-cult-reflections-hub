
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Calendar, Tag, BookOpen } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiaryEntry {
  id: string;
  title: string;
  category: string;
  notes: string;
  timeline: string;
  checklist: string[];
  created_at: string;
  updated_at: string;
}

interface DiaryListProps {
  searchTerm: string;
  selectedCategory: string;
  onEditEntry: (entry: DiaryEntry) => void;
  refreshKey: number;
}

export const DiaryList = ({ searchTerm, selectedCategory, onEditEntry, refreshKey }: DiaryListProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

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

      const formattedEntries = data?.map(entry => ({
        ...entry,
        checklist: entry.checklist || []
      })) || [];

      setEntries(formattedEntries);
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
    if (!confirm('Are you sure you want to delete this diary entry?')) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Entry Deleted",
        description: "Diary entry has been deleted successfully.",
      });

      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete diary entry.",
      });
    }
  };

  const updateChecklistItem = async (entryId: string, checklistIndex: number, completed: boolean) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const updatedChecklist = [...entry.checklist];
    // Store completion status in a way that can be tracked
    // For now, we'll just update the UI and could extend this to store completion status

    try {
      // Here you could add logic to track completion status
      // For now, just providing the UI interaction
      toast({
        title: completed ? "Task Completed" : "Task Unchecked",
        description: "Checklist item updated.",
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading && entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start your reflective journey by creating your first diary entry'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredEntries.map((entry) => (
        <Card key={entry.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{entry.title}</CardTitle>
                <div className="flex items-center space-x-3 mt-2">
                  {entry.category && (
                    <Badge variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {entry.category}
                    </Badge>
                  )}
                  {entry.timeline && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(entry.timeline).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Created {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
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
          <CardContent>
            <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{entry.notes}</p>
            
            {entry.checklist && entry.checklist.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Action Items:</h4>
                <div className="space-y-2">
                  {entry.checklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox 
                        onCheckedChange={(checked) => 
                          updateChecklistItem(entry.id, index, checked as boolean)
                        }
                      />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SearchSortHeader } from "@/components/ui/search-sort-header";
import { useSearch } from '@/hooks/useSearch';

interface DiaryEntry {
  id: string;
  title: string;
  notes: string;
  category: string | null;
  timeline: string | null;
  created_at: string;
  updated_at: string;
}

interface DiaryListProps {
  onEdit: (entry: DiaryEntry) => void;
  onRefresh: boolean;
}

export const DiaryList = ({ onEdit, onRefresh }: DiaryListProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    filteredAndSortedData,
  } = useSearch(
    entries,
    ['title', 'notes', 'category'] as (keyof DiaryEntry)[],
    'created_at' as keyof DiaryEntry,
    'desc'
  );

  useEffect(() => {
    if (userProfile) {
      fetchEntries();
    }
  }, [userProfile, onRefresh]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      toast({
        variant: "destructive",
        title: "Error fetching entries",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Entry deleted",
        description: "The diary entry has been deleted successfully.",
      });

      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        variant: "destructive",
        title: "Error deleting entry",
        description: "Please try again.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortOptions = [
    { field: 'created_at', label: 'Date Created' },
    { field: 'title', label: 'Title' },
    { field: 'category', label: 'Category' },
    { field: 'timeline', label: 'Timeline' }
  ];

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchSortHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField as string}
        sortOrder={sortOrder}
        onSort={(field) => handleSort(field as keyof DiaryEntry)}
        sortOptions={sortOptions}
        placeholder="Search entries by title, notes, or category..."
      />

      {filteredAndSortedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No entries found' : 'No diary entries yet'}
            </h3>
            <p className="text-gray-600 text-center">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Start documenting your leadership journey by adding your first entry'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedData.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(entry.created_at)}
                      </span>
                      {entry.timeline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.timeline).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.category && (
                      <Badge variant="secondary">{entry.category}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {entry.notes}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

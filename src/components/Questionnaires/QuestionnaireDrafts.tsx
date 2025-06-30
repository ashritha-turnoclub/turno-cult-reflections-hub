
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Send, Eye, Calendar } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Draft {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: number;
  deadline: string;
  published: boolean;
  created_at: string;
  questions_count: number;
}

interface QuestionnaireDraftsProps {
  onEditDraft: (draftId: string) => void;
  onRefresh: () => void;
}

export const QuestionnaireDrafts = ({ onEditDraft, onRefresh }: QuestionnaireDraftsProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      fetchDrafts();
    }
  }, [userProfile]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaires')
        .select(`
          *,
          questions(count)
        `)
        .eq('created_by', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const draftsWithCount = data?.map(q => ({
        ...q,
        questions_count: q.questions?.[0]?.count || 0
      })) || [];

      setDrafts(draftsWithCount);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questionnaires.",
      });
    } finally {
      setLoading(false);
    }
  };

  const publishQuestionnaire = async (draftId: string) => {
    try {
      setLoading(true);
      
      // Update questionnaire to published
      const { error: updateError } = await supabase
        .from('questionnaires')
        .update({ published: true })
        .eq('id', draftId);

      if (updateError) throw updateError;

      toast({
        title: "Questionnaire Published",
        description: "The questionnaire has been published and assigned to all leaders.",
      });

      fetchDrafts();
      onRefresh();
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to publish questionnaire.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('questionnaires')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      toast({
        title: "Questionnaire Deleted",
        description: "The questionnaire has been deleted successfully.",
      });

      fetchDrafts();
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete questionnaire.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && drafts.length === 0) {
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
      {drafts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires found</h3>
            <p className="text-gray-600">Create your first questionnaire to get started.</p>
          </CardContent>
        </Card>
      ) : (
        drafts.map((draft) => (
          <Card key={draft.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{draft.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {draft.description || 'No description provided'}
                  </CardDescription>
                  <div className="flex items-center space-x-3 mt-3">
                    <Badge variant={draft.published ? "default" : "secondary"}>
                      {draft.published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {draft.quarter} {draft.year}
                    </div>
                    <div className="text-sm text-gray-500">
                      Due: {new Date(draft.deadline).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {draft.questions_count} questions
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditDraft(draft.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!draft.published && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => publishQuestionnaire(draft.id)}
                        disabled={loading || draft.questions_count === 0}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDraft(draft.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
};

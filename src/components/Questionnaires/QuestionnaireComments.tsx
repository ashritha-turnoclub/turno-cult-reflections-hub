
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  comment_text: string;
  section: string | null;
  question_id: string | null;
  comment_by: string;
  created_at: string;
  commenter_name?: string;
}

interface QuestionnaireCommentsProps {
  assignmentId: string;
  isSubmitted: boolean;
}

export const QuestionnaireComments = ({ assignmentId, isSubmitted }: QuestionnaireCommentsProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assignmentId && isSubmitted) {
      fetchComments();
    }
  }, [assignmentId, isSubmitted]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feedback_comments')
        .select(`
          *,
          users!comment_by(name)
        `)
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedComments = (data || []).map(comment => ({
        ...comment,
        commenter_name: comment.users?.name || 'Unknown'
      }));

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load comments.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile?.id) return;

    try {
      setSubmitting(true);
      
      const { error } = await supabase
        .from('feedback_comments')
        .insert([{
          assignment_id: assignmentId,
          comment_text: newComment.trim(),
          comment_by: userProfile.id,
          section: 'general'
        }]);

      if (error) throw error;

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSubmitted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="h-5 w-5 mr-2" />
          Comments & Feedback
        </CardTitle>
        <CardDescription>
          {userProfile?.role === 'ceo' 
            ? "Provide feedback on this questionnaire response"
            : "View feedback from your CEO"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">{comment.commenter_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {userProfile?.role === 'ceo' ? 'CEO' : 'Leader'}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  </div>
                ))}
              </div>
            )}

            {userProfile?.role === 'ceo' && (
              <form onSubmit={handleSubmitComment} className="space-y-3 border-t pt-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your feedback..."
                  rows={3}
                />
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Adding..." : "Add Comment"}
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

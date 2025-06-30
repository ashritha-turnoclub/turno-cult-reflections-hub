
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, User, Calendar, Send } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Response {
  id: string;
  submitted_at: string;
  questionnaires: {
    id: string;
    title: string;
    quarter: string;
    year: number;
  };
  leader: {
    id: string;
    name: string;
    email: string;
  };
  answers: {
    id: string;
    answer_text: string;
    questions: {
      id: string;
      question_title: string;
      question_detail: string;
      section: string;
      order_index: number;
    };
  }[];
  comments?: {
    id: string;
    comment_text: string;
    created_at: string;
    question_id: string | null;
    section: string | null;
  }[];
}

export const ResponseReview = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState<{ questionId?: string; section?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'ceo') {
      fetchResponses();
    }
  }, [userProfile]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaire_assignments')
        .select(`
          *,
          questionnaires!inner(
            id,
            title,
            quarter,
            year,
            created_by
          ),
          users!questionnaire_assignments_leader_id_fkey(
            id,
            name,
            email
          ),
          answers(
            id,
            answer_text,
            questions(
              id,
              question_title,
              question_detail,
              section,
              order_index
            )
          )
        `)
        .eq('questionnaires.created_by', userProfile?.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch comments for each response
      const responsesWithComments = await Promise.all(
        (data || []).map(async (response) => {
          const { data: comments, error: commentsError } = await supabase
            .from('feedback_comments')
            .select('*')
            .eq('assignment_id', response.id);

          if (commentsError) {
            console.error('Error fetching comments:', commentsError);
          }

          return {
            id: response.id,
            submitted_at: response.submitted_at,
            questionnaires: response.questionnaires,
            leader: response.users,
            answers: response.answers || [],
            comments: comments || []
          };
        })
      );

      setResponses(responsesWithComments);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast({
        variant: "destructive",
        title: "Error fetching responses",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (questionId?: string, section?: string) => {
    if (!selectedResponse || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('feedback_comments')
        .insert([{
          assignment_id: selectedResponse.id,
          question_id: questionId || null,
          section: section || null,
          comment_text: newComment,
          comment_by: userProfile?.id
        }]);

      if (error) throw error;

      toast({
        title: "Comment added",
        description: "Your feedback has been saved.",
      });

      setNewComment('');
      setCommentingOn(null);
      fetchResponses();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: "destructive",
        title: "Error adding comment",
        description: "Please try again.",
      });
    }
  };

  const getCommentsForQuestion = (questionId: string) => {
    return selectedResponse?.comments?.filter(comment => comment.question_id === questionId) || [];
  };

  const getCommentsForSection = (section: string) => {
    return selectedResponse?.comments?.filter(comment => comment.section === section && !comment.question_id) || [];
  };

  if (userProfile?.role !== 'ceo') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Only CEOs can review questionnaire responses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Response Review</h2>
        <p className="text-gray-600">Review and comment on leader responses</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : responses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600 text-center">
              Leader responses will appear here once they submit their questionnaires.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {response.leader.name}
                      <Badge variant="outline">
                        {response.questionnaires.title}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      Submitted: {new Date(response.submitted_at).toLocaleDateString()}
                      • {response.questionnaires.quarter} {response.questionnaires.year}
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedResponse(response)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Review & Comment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {response.leader.name}'s Response - {response.questionnaires.title}
                        </DialogTitle>
                        <DialogDescription>
                          Submitted on {new Date(response.submitted_at).toLocaleDateString()}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedResponse && (
                        <div className="space-y-6">
                          {/* Group answers by section */}
                          {Object.entries(
                            selectedResponse.answers.reduce((acc, answer) => {
                              const section = answer.questions.section;
                              if (!acc[section]) acc[section] = [];
                              acc[section].push(answer);
                              return acc;
                            }, {} as Record<string, typeof selectedResponse.answers>)
                          ).map(([section, sectionAnswers]) => (
                            <Card key={section}>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                  {section}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCommentingOn({ section })}
                                  >
                                    Comment on Section
                                  </Button>
                                </CardTitle>
                                
                                {/* Section Comments */}
                                {getCommentsForSection(section).length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    <h5 className="font-medium text-sm text-blue-600">Your Comments:</h5>
                                    {getCommentsForSection(section).map((comment) => (
                                      <div key={comment.id} className="bg-blue-50 p-2 rounded text-sm">
                                        {comment.comment_text}
                                        <span className="text-xs text-gray-500 ml-2">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {sectionAnswers
                                  .sort((a, b) => a.questions.order_index - b.questions.order_index)
                                  .map((answer) => (
                                  <div key={answer.id} className="border-l-4 border-purple-500 pl-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium">{answer.questions.question_title}</h4>
                                        {answer.questions.question_detail && (
                                          <p className="text-sm text-gray-600">{answer.questions.question_detail}</p>
                                        )}
                                        <div className="mt-2 p-3 bg-gray-50 rounded">
                                          <p className="text-sm">{answer.answer_text || 'No response provided'}</p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCommentingOn({ questionId: answer.questions.id })}
                                      >
                                        Comment
                                      </Button>
                                    </div>
                                    
                                    {/* Question Comments */}
                                    {getCommentsForQuestion(answer.questions.id).length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="font-medium text-sm text-blue-600">Your Comments:</h5>
                                        {getCommentsForQuestion(answer.questions.id).map((comment) => (
                                          <div key={comment.id} className="bg-blue-50 p-2 rounded text-sm">
                                            {comment.comment_text}
                                            <span className="text-xs text-gray-500 ml-2">
                                              {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          ))}
                          
                          {/* Comment Input Dialog */}
                          {commentingOn && (
                            <Card className="border-blue-200">
                              <CardHeader>
                                <CardTitle className="text-lg text-blue-600">
                                  Add Comment {commentingOn.section ? `on ${commentingOn.section} Section` : 'on Question'}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <Textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Enter your feedback or comment..."
                                  className="min-h-[100px]"
                                />
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={() => handleAddComment(commentingOn.questionId, commentingOn.section)}
                                    disabled={!newComment.trim()}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Add Comment
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setCommentingOn(null);
                                      setNewComment('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Answers: {response.answers.length}</span>
                    <span>Comments: {response.comments?.length || 0}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Leader: {response.leader.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, Send } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  assigned_at: string;
  submitted_at: string | null;
  questionnaires: {
    id: string;
    title: string;
    description: string;
    quarter: string;
    year: number;
    deadline: string;
    questions: {
      id: string;
      question_title: string;
      question_detail: string;
      section: string;
      order_index: number;
    }[];
  };
  answers?: {
    question_id: string;
    answer_text: string;
  }[];
}

export const LeaderQuestionnaires = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'leader') {
      fetchAssignments();
    }
  }, [userProfile]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaire_assignments')
        .select(`
          *,
          questionnaires!inner(
            *,
            questions(*)
          )
        `)
        .eq('leader_id', userProfile?.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        variant: "destructive",
        title: "Error fetching questionnaires",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAnswers = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('question_id, answer_text')
        .eq('assignment_id', assignmentId);

      if (error) throw error;

      const answersMap: Record<string, string> = {};
      data?.forEach(answer => {
        answersMap[answer.question_id] = answer.answer_text || '';
      });
      setAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching existing answers:', error);
    }
  };

  const handleStartQuestionnaire = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    fetchExistingAnswers(assignment.id);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitQuestionnaire = async () => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      
      // Save/update answers
      const answersToSave = Object.entries(answers).map(([questionId, answerText]) => ({
        assignment_id: selectedAssignment.id,
        question_id: questionId,
        answer_text: answerText
      }));

      // First, delete existing answers for this assignment
      await supabase
        .from('answers')
        .delete()
        .eq('assignment_id', selectedAssignment.id);

      // Insert new answers
      if (answersToSave.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersToSave);

        if (answersError) throw answersError;
      }

      // Mark assignment as submitted
      const { error: submissionError } = await supabase
        .from('questionnaire_assignments')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', selectedAssignment.id);

      if (submissionError) throw submissionError;

      toast({
        title: "Questionnaire submitted",
        description: "Your responses have been saved and submitted successfully.",
      });

      setSelectedAssignment(null);
      setAnswers({});
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error submitting questionnaire",
        description: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (userProfile?.role !== 'leader') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Only leaders can view and complete questionnaires.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Questionnaires</h2>
        <p className="text-gray-600">Complete assigned questionnaires from your CEO</p>
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
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires assigned</h3>
            <p className="text-gray-600 text-center">
              You'll see questionnaires here when your CEO assigns them to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {assignment.questionnaires.title}
                      <Badge variant={assignment.submitted_at ? "default" : isOverdue(assignment.questionnaires.deadline) ? "destructive" : "secondary"}>
                        {assignment.submitted_at ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </>
                        ) : isOverdue(assignment.questionnaires.deadline) ? (
                          "Overdue"
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {assignment.questionnaires.description} • {assignment.questionnaires.quarter} {assignment.questionnaires.year}
                    </CardDescription>
                  </div>
                  {!assignment.submitted_at && (
                    <Button onClick={() => handleStartQuestionnaire(assignment)}>
                      {assignment.submitted_at ? "View Responses" : "Start Questionnaire"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Questions: {assignment.questionnaires.questions?.length || 0}</span>
                    <span className={`${isOverdue(assignment.questionnaires.deadline) && !assignment.submitted_at ? 'text-red-600' : 'text-gray-600'}`}>
                      Due: {new Date(assignment.questionnaires.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  {assignment.submitted_at && (
                    <p className="text-sm text-green-600">
                      Completed on {new Date(assignment.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Questionnaire Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.questionnaires.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.questionnaires.description} • Due: {selectedAssignment && new Date(selectedAssignment.questionnaires.deadline).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              {selectedAssignment.questionnaires.questions
                ?.sort((a, b) => a.order_index - b.order_index)
                .map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <Label className="text-base font-medium">
                      {index + 1}. {question.question_title}
                    </Label>
                    {question.question_detail && (
                      <p className="text-sm text-gray-600 mt-1">
                        {question.question_detail}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {question.section}
                    </Badge>
                  </div>
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your response here..."
                    className="min-h-[100px]"
                    disabled={selectedAssignment.submitted_at !== null}
                  />
                </div>
              ))}
              
              {!selectedAssignment.submitted_at && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
                    Save Draft & Close
                  </Button>
                  <Button onClick={handleSubmitQuestionnaire} disabled={submitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Questionnaire"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, FileText, Send, CheckCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  };
}

interface Question {
  id: string;
  section: string;
  question_title: string;
  question_detail: string;
  order_index: number;
}

interface Answer {
  question_id: string;
  answer_text: string;
}

export const LeaderQuestionnaires = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
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
          questionnaires(*)
        `)
        .eq('leader_id', userProfile?.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questionnaires.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionnaire = async (assignment: Assignment) => {
    try {
      setLoading(true);
      setSelectedAssignment(assignment);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', assignment.questionnaires.id)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch existing answers if any
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assignment_id', assignment.id);

      if (answersError) throw answersError;

      // Initialize answers state
      const existingAnswers = answersData || [];
      const answerMap: Answer[] = (questionsData || []).map(q => ({
        question_id: q.id,
        answer_text: existingAnswers.find(a => a.question_id === q.id)?.answer_text || ''
      }));

      setAnswers(answerMap);
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questionnaire details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (questionId: string, answerText: string) => {
    setAnswers(prev => 
      prev.map(a => 
        a.question_id === questionId 
          ? { ...a, answer_text: answerText }
          : a
      )
    );
  };

  const saveAnswers = async (submit = false) => {
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);

      // Prepare answers for database
      const answersToSave = answers.filter(a => a.answer_text.trim() !== '');

      // Delete existing answers
      await supabase
        .from('answers')
        .delete()
        .eq('assignment_id', selectedAssignment.id);

      // Insert new answers
      if (answersToSave.length > 0) {
        const { error: answersError } = await supabase
          .from('answers')
          .insert(
            answersToSave.map(a => ({
              assignment_id: selectedAssignment.id,
              question_id: a.question_id,
              answer_text: a.answer_text
            }))
          );

        if (answersError) throw answersError;
      }

      // Update assignment status if submitting
      if (submit) {
        const { error: assignmentError } = await supabase
          .from('questionnaire_assignments')
          .update({ submitted_at: new Date().toISOString() })
          .eq('id', selectedAssignment.id);

        if (assignmentError) throw assignmentError;

        // Refresh assignments to show updated status
        await fetchAssignments();
        setSelectedAssignment(null);
        setQuestions([]);
        setAnswers([]);
      }

      toast({
        title: submit ? "Questionnaire Submitted" : "Answers Saved",
        description: submit 
          ? "Your responses have been submitted successfully."
          : "Your progress has been saved.",
      });

    } catch (error) {
      console.error('Error saving answers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save answers. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = () => {
    const answeredQuestions = answers.filter(a => a.answer_text.trim() !== '').length;
    return questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;
  };

  const groupQuestionsBySection = () => {
    return questions.reduce((acc, question) => {
      if (!acc[question.section]) {
        acc[question.section] = [];
      }
      acc[question.section].push(question);
      return acc;
    }, {} as Record<string, Question[]>);
  };

  if (loading && assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedAssignment) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires assigned</h3>
                <p className="text-gray-600 text-center">
                  You don't have any questionnaires assigned at the moment. Check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assignment.questionnaires.title}</CardTitle>
                    <Badge variant={assignment.submitted_at ? "default" : "destructive"}>
                      {assignment.submitted_at ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </>
                      ) : (
                        "Pending"
                      )}
                    </Badge>
                  </div>
                  <CardDescription>
                    {assignment.questionnaires.quarter} {assignment.questionnaires.year}
                    {assignment.questionnaires.description && ` • ${assignment.questionnaires.description}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {new Date(assignment.questionnaires.deadline).toLocaleDateString()}
                    </div>
                    {assignment.submitted_at && (
                      <div>
                        Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => loadQuestionnaire(assignment)}
                    className="w-full"
                    disabled={loading}
                  >
                    {assignment.submitted_at ? "View Responses" : "Start Questionnaire"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  const questionsBySection = groupQuestionsBySection();
  const progress = calculateProgress();
  const canSubmit = progress === 100 && !selectedAssignment.submitted_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedAssignment.questionnaires.title}</CardTitle>
              <CardDescription>
                {selectedAssignment.questionnaires.quarter} {selectedAssignment.questionnaires.year} • 
                Due: {new Date(selectedAssignment.questionnaires.deadline).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
              Back to List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {selectedAssignment.submitted_at && (
            <Badge className="mt-4">
              <CheckCircle className="h-3 w-3 mr-1" />
              Submitted on {new Date(selectedAssignment.submitted_at).toLocaleDateString()}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Questions by Section */}
      {Object.entries(questionsBySection).map(([section, sectionQuestions]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-lg">{section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {sectionQuestions.map((question) => {
              const answer = answers.find(a => a.question_id === question.id);
              return (
                <div key={question.id} className="space-y-3">
                  <div>
                    <h4 className="font-medium">{question.question_title}</h4>
                    {question.question_detail && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {question.question_detail}
                      </p>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter your response..."
                    value={answer?.answer_text || ''}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    rows={4}
                    disabled={!!selectedAssignment.submitted_at}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      {!selectedAssignment.submitted_at && (
        <div className="flex space-x-4">
          <Button
            onClick={() => saveAnswers(false)}
            disabled={submitting}
            variant="outline"
          >
            Save Progress
          </Button>
          
          <Button
            onClick={() => saveAnswers(true)}
            disabled={submitting || !canSubmit}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Questionnaire"}
          </Button>
        </div>
      )}
    </div>
  );
};

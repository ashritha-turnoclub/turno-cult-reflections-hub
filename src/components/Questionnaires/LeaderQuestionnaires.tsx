
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, FileText, Calendar, MessageSquare } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { QuestionnaireComments } from './QuestionnaireComments';
import { SearchSortHeader } from "@/components/ui/search-sort-header";
import { useSearch } from '@/hooks/useSearch';

interface Question {
  id: string;
  question_title: string;
  question_detail: string | null;
  section: string;
  order_index: number;
}

interface Answer {
  id: string;
  question_id: string;
  answer_text: string | null;
}

interface Assignment {
  id: string;
  questionnaire_id: string;
  submitted_at: string | null;
  assigned_at: string;
  questionnaires: {
    title: string;
    description: string | null;
    deadline: string;
    quarter: string;
    year: number;
  };
}

export const LeaderQuestionnaires = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [existingAnswers, setExistingAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    sortField,
    sortOrder,
    handleSort,
    filteredAndSortedData,
  } = useSearch(
    assignments,
    ['questionnaires.title', 'questionnaires.quarter'] as any,
    'assigned_at' as any,
    'desc'
  );

  useEffect(() => {
    if (userProfile) {
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
          questionnaires (
            title,
            description,
            deadline,
            quarter,
            year
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

  const fetchQuestionnaireDetails = async (assignment: Assignment) => {
    try {
      setLoading(true);
      
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', assignment.questionnaire_id)
        .order('order_index');

      if (questionsError) throw questionsError;

      // Fetch existing answers
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('assignment_id', assignment.id);

      if (answersError) throw answersError;

      setQuestions(questionsData || []);
      setExistingAnswers(answersData || []);
      
      // Populate answers form
      const answersMap: Record<string, string> = {};
      (answersData || []).forEach(answer => {
        answersMap[answer.question_id] = answer.answer_text || '';
      });
      setAnswers(answersMap);
      
      setSelectedAssignment(assignment);
    } catch (error) {
      console.error('Error fetching questionnaire details:', error);
      toast({
        variant: "destructive",
        title: "Error loading questionnaire",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !userProfile) return;

    try {
      setSubmitting(true);

      // Save/update answers
      for (const question of questions) {
        const answerText = answers[question.id] || '';
        const existingAnswer = existingAnswers.find(a => a.question_id === question.id);

        if (existingAnswer) {
          // Update existing answer
          const { error } = await supabase
            .from('answers')
            .update({ answer_text: answerText })
            .eq('id', existingAnswer.id);

          if (error) throw error;
        } else {
          // Create new answer
          const { error } = await supabase
            .from('answers')
            .insert({
              assignment_id: selectedAssignment.id,
              question_id: question.id,
              answer_text: answerText
            });

          if (error) throw error;
        }
      }

      // Mark assignment as submitted
      const { error: updateError } = await supabase
        .from('questionnaire_assignments')
        .update({ submitted_at: new Date().toISOString() })
        .eq('id', selectedAssignment.id);

      if (updateError) throw updateError;

      toast({
        title: "Questionnaire submitted",
        description: "Your responses have been saved successfully.",
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

  const sortOptions = [
    { field: 'assigned_at', label: 'Date Assigned' },
    { field: 'questionnaires.title', label: 'Title' },
    { field: 'questionnaires.deadline', label: 'Deadline' },
    { field: 'questionnaires.quarter', label: 'Quarter' }
  ];

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.submitted_at) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    const isOverdue = new Date(assignment.questionnaires.deadline) < new Date();
    return (
      <Badge variant={isOverdue ? "destructive" : "secondary"}>
        {isOverdue ? "Overdue" : "Pending"}
      </Badge>
    );
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SearchSortHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField as string}
        sortOrder={sortOrder}
        onSort={(field) => handleSort(field as any)}
        sortOptions={sortOptions}
        placeholder="Search questionnaires by title or quarter..."
      />

      {filteredAndSortedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No questionnaires found' : 'No questionnaires assigned'}
            </h3>
            <p className="text-gray-600 text-center">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Your CEO will assign questionnaires that will appear here'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedData.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{assignment.questionnaires.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {assignment.questionnaires.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {assignment.questionnaires.quarter} {assignment.questionnaires.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due: {new Date(assignment.questionnaires.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(assignment)}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchQuestionnaireDetails(assignment)}
                      >
                        {assignment.submitted_at ? "View" : "Complete"}
                      </Button>
                      {assignment.submitted_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowComments(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Comments
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Questionnaire Dialog */}
      <Dialog open={!!selectedAssignment && !showComments} onOpenChange={(open) => {
        if (!open) {
          setSelectedAssignment(null);
          setAnswers({});
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.questionnaires.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.questionnaires.description}
            </DialogDescription>
          </DialogHeader>
          
          {questions.length > 0 && (
            <div className="space-y-6">
              {Object.entries(
                questions.reduce((acc, question) => {
                  if (!acc[question.section]) {
                    acc[question.section] = [];
                  }
                  acc[question.section].push(question);
                  return acc;
                }, {} as Record<string, Question[]>)
              ).map(([section, sectionQuestions]) => (
                <div key={section} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    {section}
                  </h3>
                  {sectionQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label className="text-base font-medium">
                        {question.question_title}
                      </Label>
                      {question.question_detail && (
                        <p className="text-sm text-gray-600">{question.question_detail}</p>
                      )}
                      <Textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                        placeholder="Enter your response..."
                        className="min-h-[100px]"
                        disabled={!!selectedAssignment?.submitted_at}
                      />
                    </div>
                  ))}
                </div>
              ))}
              
              {!selectedAssignment?.submitted_at && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAssignment(null)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Questionnaire"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback & Comments</DialogTitle>
            <DialogDescription>
              View feedback from your CEO on your questionnaire responses
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <QuestionnaireComments assignmentId={selectedAssignment.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

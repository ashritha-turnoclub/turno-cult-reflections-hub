
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Send, Save } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id?: string;
  question_title: string;
  question_detail: string;
  section: string;
  order_index: number;
}

interface Questionnaire {
  id?: string;
  title: string;
  description: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  deadline: string;
  published: boolean;
  questions?: Question[];
}

export const QuestionnaireBuilder = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newQuestionnaire, setNewQuestionnaire] = useState<Questionnaire>({
    title: '',
    description: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    deadline: '',
    published: false
  });
  const [newQuestion, setNewQuestion] = useState<Question>({
    question_title: '',
    question_detail: '',
    section: 'General',
    order_index: 0
  });

  useEffect(() => {
    if (userProfile?.role === 'ceo') {
      fetchQuestionnaires();
    }
  }, [userProfile]);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaires')
        .select(`
          *,
          questions(*)
        `)
        .eq('created_by', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestionnaires(data || []);
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      toast({
        variant: "destructive",
        title: "Error fetching questionnaires",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questionnaires')
        .insert([{
          title: newQuestionnaire.title,
          description: newQuestionnaire.description,
          quarter: newQuestionnaire.quarter,
          year: newQuestionnaire.year,
          deadline: newQuestionnaire.deadline,
          published: false,
          created_by: userProfile?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Questionnaire created",
        description: "You can now add questions to your questionnaire.",
      });

      setNewQuestionnaire({
        title: '',
        description: '',
        quarter: 'Q1',
        year: new Date().getFullYear(),
        deadline: '',
        published: false
      });
      setIsCreating(false);
      fetchQuestionnaires();
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error creating questionnaire",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionnaire?.id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('questions')
        .insert([{
          question_title: newQuestion.question_title,
          question_detail: newQuestion.question_detail,
          section: newQuestion.section,
          order_index: newQuestion.order_index,
          questionnaire_id: selectedQuestionnaire.id
        }]);

      if (error) throw error;

      toast({
        title: "Question added",
        description: "Question has been added to the questionnaire.",
      });

      setNewQuestion({
        question_title: '',
        question_detail: '',
        section: 'General',
        order_index: 0
      });
      setIsAddingQuestion(false);
      fetchQuestionnaires();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        variant: "destructive",
        title: "Error adding question",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuestionnaire = async (questionnaire: Questionnaire) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('questionnaires')
        .update({ published: true })
        .eq('id', questionnaire.id);

      if (error) throw error;

      toast({
        title: "Questionnaire published",
        description: "All leaders have been notified and can now complete this questionnaire.",
      });

      fetchQuestionnaires();
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error publishing questionnaire",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userProfile?.role !== 'ceo') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Only CEOs can create and manage questionnaires.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Questionnaire Builder</h2>
          <p className="text-gray-600">Create and manage questionnaires for your team</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Questionnaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Questionnaire</DialogTitle>
              <DialogDescription>
                Set up the basic details for your questionnaire. You can add questions after creation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuestionnaire} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newQuestionnaire.title}
                  onChange={(e) => setNewQuestionnaire({...newQuestionnaire, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newQuestionnaire.description}
                  onChange={(e) => setNewQuestionnaire({...newQuestionnaire, description: e.target.value})}
                  placeholder="Brief description of the questionnaire..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter *</Label>
                  <Select value={newQuestionnaire.quarter} onValueChange={(value: 'Q1' | 'Q2' | 'Q3' | 'Q4') => setNewQuestionnaire({...newQuestionnaire, quarter: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newQuestionnaire.year}
                    onChange={(e) => setNewQuestionnaire({...newQuestionnaire, year: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newQuestionnaire.deadline}
                  onChange={(e) => setNewQuestionnaire({...newQuestionnaire, deadline: e.target.value})}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Questionnaire"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && questionnaires.length === 0 ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questionnaires.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first questionnaire to start collecting feedback from your team
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Questionnaire
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {questionnaire.title}
                      <Badge variant={questionnaire.published ? "default" : "secondary"}>
                        {questionnaire.published ? "Published" : "Draft"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {questionnaire.description} • {questionnaire.quarter} {questionnaire.year} • Due: {new Date(questionnaire.deadline).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedQuestionnaire(questionnaire);
                        setIsAddingQuestion(true);
                      }}
                      disabled={questionnaire.published}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                    {!questionnaire.published && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishQuestionnaire(questionnaire)}
                        disabled={!questionnaire.questions || questionnaire.questions.length === 0}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Questions: {questionnaire.questions?.length || 0}</span>
                    {questionnaire.published && (
                      <span className="text-green-600">✓ Published & Assigned to Leaders</span>
                    )}
                  </div>
                  
                  {questionnaire.questions && questionnaire.questions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Questions:</h4>
                      <div className="space-y-2">
                        {questionnaire.questions.map((question, index) => (
                          <div key={question.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{index + 1}. {question.question_title}</p>
                                {question.question_detail && (
                                  <p className="text-xs text-gray-600 mt-1">{question.question_detail}</p>
                                )}
                                <Badge variant="outline" className="text-xs mt-1">
                                  {question.section}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Dialog */}
      <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
            <DialogDescription>
              Add a new question to "{selectedQuestionnaire?.title}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_title">Question Title *</Label>
              <Input
                id="question_title"
                value={newQuestion.question_title}
                onChange={(e) => setNewQuestion({...newQuestion, question_title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_detail">Question Details</Label>
              <Textarea
                id="question_detail"
                value={newQuestion.question_detail}
                onChange={(e) => setNewQuestion({...newQuestion, question_detail: e.target.value})}
                placeholder="Additional context or instructions for this question..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={newQuestion.section} onValueChange={(value) => setNewQuestion({...newQuestion, section: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Performance">Performance</SelectItem>
                  <SelectItem value="Goals">Goals</SelectItem>
                  <SelectItem value="Feedback">Feedback</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Question"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddingQuestion(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

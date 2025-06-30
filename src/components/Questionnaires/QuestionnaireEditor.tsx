
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id?: string;
  section: string;
  question_title: string;
  question_detail: string;
  order_index: number;
}

interface QuestionnaireData {
  id?: string;
  title: string;
  description: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  deadline: string;
  questions: Question[];
}

interface QuestionnaireEditorProps {
  questionnaireId?: string;
  onBack: () => void;
  onSave: () => void;
}

export const QuestionnaireEditor = ({ questionnaireId, onBack, onSave }: QuestionnaireEditorProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({
    title: '',
    description: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    deadline: '',
    questions: []
  });

  const sections = [
    'Leadership Skills',
    'Team Management', 
    'Strategic Thinking',
    'Communication',
    'Personal Development',
    'Decision Making',
    'Problem Solving'
  ];

  useEffect(() => {
    if (questionnaireId) {
      loadQuestionnaire();
    }
  }, [questionnaireId]);

  const loadQuestionnaire = async () => {
    if (!questionnaireId) return;

    try {
      setLoading(true);
      
      // Load questionnaire
      const { data: questionnaireData, error: qError } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('id', questionnaireId)
        .single();

      if (qError) throw qError;

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('questionnaire_id', questionnaireId)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuestionnaire({
        id: questionnaireData.id,
        title: questionnaireData.title,
        description: questionnaireData.description || '',
        quarter: questionnaireData.quarter,
        year: questionnaireData.year,
        deadline: questionnaireData.deadline,
        questions: questionsData || []
      });
    } catch (error) {
      console.error('Error loading questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questionnaire.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (questionnaire.questions.length >= 30) {
      toast({
        variant: "destructive",
        title: "Question Limit Reached",
        description: "Maximum 30 questions allowed per questionnaire.",
      });
      return;
    }

    const newQuestion: Question = {
      section: sections[0],
      question_title: '',
      question_detail: '',
      order_index: questionnaire.questions.length
    };

    setQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    setQuestionnaire(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setQuestionnaire(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!questionnaire.title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a questionnaire title.",
      });
      return false;
    }

    if (!questionnaire.deadline) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please set a deadline.",
      });
      return false;
    }

    const invalidQuestions = questionnaire.questions.some(q => !q.question_title.trim());
    if (invalidQuestions) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All questions must have a title.",
      });
      return false;
    }

    return true;
  };

  const saveQuestionnaire = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      let questionnaireId = questionnaire.id;

      if (questionnaireId) {
        // Update existing questionnaire
        const { error: updateError } = await supabase
          .from('questionnaires')
          .update({
            title: questionnaire.title,
            description: questionnaire.description,
            quarter: questionnaire.quarter,
            year: questionnaire.year,
            deadline: questionnaire.deadline
          })
          .eq('id', questionnaireId);

        if (updateError) throw updateError;

        // Delete existing questions
        await supabase
          .from('questions')
          .delete()
          .eq('questionnaire_id', questionnaireId);
      } else {
        // Create new questionnaire
        const { data: newQuestionnaire, error: createError } = await supabase
          .from('questionnaires')
          .insert({
            title: questionnaire.title,
            description: questionnaire.description,
            quarter: questionnaire.quarter,
            year: questionnaire.year,
            deadline: questionnaire.deadline,
            created_by: userProfile?.id,
            published: false
          })
          .select()
          .single();

        if (createError) throw createError;
        questionnaireId = newQuestionnaire.id;
      }

      // Insert questions
      if (questionnaire.questions.length > 0) {
        const questionsToInsert = questionnaire.questions.map((q, index) => ({
          questionnaire_id: questionnaireId,
          section: q.section,
          question_title: q.question_title,
          question_detail: q.question_detail,
          order_index: index
        }));

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast({
        title: "Questionnaire Saved",
        description: "The questionnaire has been saved successfully.",
      });

      onSave();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save questionnaire.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <Button onClick={saveQuestionnaire} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Draft"}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{questionnaireId ? 'Edit Questionnaire' : 'Create New Questionnaire'}</CardTitle>
          <CardDescription>Set up the basic information for your questionnaire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 2024 Leadership Assessment"
                value={questionnaire.title}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={questionnaire.deadline}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={questionnaire.quarter}
                onValueChange={(value: 'Q1' | 'Q2' | 'Q3' | 'Q4') => 
                  setQuestionnaire(prev => ({ ...prev, quarter: value }))
                }
              >
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
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={questionnaire.year}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this questionnaire..."
              value={questionnaire.description}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Questions ({questionnaire.questions.length}/30)</CardTitle>
            <CardDescription>Add questions organized by sections</CardDescription>
          </div>
          <Button onClick={addQuestion} size="sm" disabled={questionnaire.questions.length >= 30}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionnaire.questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            questionnaire.questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select
                        value={question.section}
                        onValueChange={(value) => updateQuestion(index, 'section', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(section => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Question Title *</Label>
                      <Input
                        placeholder="Enter the main question..."
                        value={question.question_title}
                        onChange={(e) => updateQuestion(index, 'question_title', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Additional Details</Label>
                      <Textarea
                        placeholder="Provide context or additional instructions..."
                        value={question.question_detail}
                        onChange={(e) => updateQuestion(index, 'question_detail', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

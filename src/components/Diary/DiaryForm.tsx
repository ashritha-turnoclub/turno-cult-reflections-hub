
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, Calendar, Tag } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
  title: string;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
}

interface DiaryEntry {
  id?: string;
  title: string;
  category: string | null;
  notes: string;
  timeline: string | null;
  checklist: ActionItem[];
  tags: string[];
}

interface DiaryFormProps {
  entry?: DiaryEntry;
  onSave: () => void;
  onCancel: () => void;
}

const defaultTags = [
  'Sales', 'Marketing', 'Business', 'Lending', 'Battery', 
  'Credit Operations', 'Collections', 'Finance', 'HR', 'Operations'
];

export const DiaryForm = ({ entry, onSave, onCancel }: DiaryFormProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DiaryEntry>({
    title: '',
    category: null,
    notes: '',
    timeline: null,
    checklist: [],
    tags: []
  });

  const categories = [
    'Team Meetings',
    'Self-Reflection', 
    'Client Relations',
    'Strategic Planning',
    'Personal Development',
    'Leadership Growth',
    'Goal Setting'
  ];

  useEffect(() => {
    if (entry) {
      setFormData({
        ...entry,
        checklist: Array.isArray(entry.checklist) 
          ? entry.checklist.map(item => 
              typeof item === 'string' 
                ? { title: item, completed: false }
                : item
            )
          : [],
        tags: Array.isArray(entry.tags) ? entry.tags : []
      });
    }
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      
      const dataToSave = {
        ...formData,
        user_id: userProfile.id,
        checklist: formData.checklist as any,
        tags: formData.tags
      };

      if (entry?.id) {
        const { error } = await supabase
          .from('diary_entries')
          .update(dataToSave)
          .eq('id', entry.id);

        if (error) throw error;

        toast({
          title: "Entry Updated",
          description: "Your diary entry has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('diary_entries')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Entry Created",
          description: "Your diary entry has been created successfully.",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving diary entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save diary entry.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { title: '', completed: false }]
    }));
  };

  const updateActionItem = (index: number, field: keyof ActionItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              [field]: value,
              ...(field === 'completed' && value === true ? { completed_at: new Date().toISOString() } : {})
            }
          : item
      )
    }));
  };

  const removeActionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry ? 'Edit Diary Entry' : 'New Diary Entry'}</CardTitle>
        <CardDescription>
          {entry ? 'Update your diary entry' : 'Create a new diary entry'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter entry title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addTag}>
              <SelectTrigger>
                <SelectValue placeholder="Add tags" />
              </SelectTrigger>
              <SelectContent>
                {defaultTags.filter(tag => !formData.tags.includes(tag)).map(tag => (
                  <SelectItem key={tag} value={tag}>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      {tag}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              type="date"
              value={formData.timeline || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Write your thoughts and reflections..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Action Items</Label>
              <Button type="button" onClick={addActionItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {formData.checklist.map((item, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => updateActionItem(index, 'completed', checked as boolean)}
                  />
                  <Input
                    value={item.title}
                    onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                    placeholder="Enter action item"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActionItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 ml-6">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={item.deadline || ''}
                    onChange={(e) => updateActionItem(index, 'deadline', e.target.value)}
                    placeholder="Set deadline"
                    className="w-40"
                  />
                  {item.completed && item.completed_at && (
                    <span className="text-sm text-green-600">
                      Completed on {new Date(item.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

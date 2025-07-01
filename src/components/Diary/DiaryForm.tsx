
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiaryEntry {
  id?: string;
  title: string;
  category: string | null;
  notes: string;
  timeline: string | null;
  checklist: string[];
}

interface DiaryFormProps {
  entry?: DiaryEntry;
  onSave: () => void;
  onCancel: () => void;
}

export const DiaryForm = ({ entry, onSave, onCancel }: DiaryFormProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DiaryEntry>({
    title: '',
    category: null,
    notes: '',
    timeline: null,
    checklist: []
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
        checklist: Array.isArray(entry.checklist) ? entry.checklist : []
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
        checklist: formData.checklist
      };

      if (entry?.id) {
        // Update existing entry
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
        // Create new entry
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

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, '']
    }));
  };

  const updateChecklistItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => i === index ? value : item)
    }));
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
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
              <Button type="button" onClick={addChecklistItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {formData.checklist.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={(e) => updateChecklistItem(index, e.target.value)}
                  placeholder="Enter action item"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

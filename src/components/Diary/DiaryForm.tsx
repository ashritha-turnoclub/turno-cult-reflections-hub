
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
  category: string;
  notes: string;
  timeline: string;
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
    category: '',
    notes: '',
    timeline: new Date().toISOString().split('T')[0],
    checklist: ['']
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
        checklist: entry.checklist && entry.checklist.length > 0 ? entry.checklist : ['']
      });
    }
  }, [entry]);

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

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a title for your diary entry.",
      });
      return false;
    }

    if (!formData.notes.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your notes and reflections.",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const entryData = {
        title: formData.title.trim(),
        category: formData.category || null,
        notes: formData.notes.trim(),
        timeline: formData.timeline || null,
        checklist: formData.checklist.filter(item => item.trim() !== ''),
        user_id: userProfile?.id
      };

      if (entry?.id) {
        // Update existing entry
        const { error } = await supabase
          .from('diary_entries')
          .update(entryData)
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
          .insert(entryData);

        if (error) throw error;

        toast({
          title: "Entry Created",
          description: "Your diary entry has been saved successfully.",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving diary entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save diary entry. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry?.id ? 'Edit Diary Entry' : 'New Diary Entry'}</CardTitle>
        <CardDescription>Record your thoughts, reflections, and action items</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entry-title">Title *</Label>
            <Input
              id="entry-title"
              placeholder="e.g., Team Retrospective Meeting"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entry-category">Category</Label>
            <Select 
              value={formData.category} 
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
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="entry-timeline">Date</Label>
            <Input
              id="entry-timeline"
              type="date"
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="entry-notes">Notes & Reflections *</Label>
          <Textarea
            id="entry-notes"
            placeholder="Write your thoughts, observations, and reflections..."
            rows={6}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Action Items Checklist</Label>
          {formData.checklist.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Add an action item..."
                value={item}
                onChange={(e) => updateChecklistItem(index, e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => removeChecklistItem(index)}
                disabled={formData.checklist.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Entry"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


import { useState } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  BookOpen, 
  Edit, 
  Trash2, 
  Calendar,
  Tag,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Diary = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newEntry, setNewEntry] = useState({
    title: '',
    category: '',
    notes: '',
    timeline: '',
    checklist: ['']
  });
  const { toast } = useToast();

  // Mock data
  const diaryEntries = [
    {
      id: 1,
      title: 'Team Retrospective - Q4 Planning',
      category: 'Team Meetings',
      notes: 'Great discussion about our Q4 goals. The team is aligned on priorities and seems motivated. Need to follow up on resource allocation concerns raised by Sarah.',
      timeline: '2024-01-15',
      checklist: ['Follow up with Sarah on resources', 'Schedule one-on-ones', 'Review budget allocation'],
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: 'Personal Leadership Reflection',
      category: 'Self-Reflection',
      notes: 'Noticed I\'ve been more reactive in meetings lately. Need to practice active listening and pause before responding. The meditation sessions are helping with focus.',
      timeline: '2024-01-14',
      checklist: ['Start daily meditation', 'Read chapter on emotional intelligence', 'Practice pause technique'],
      createdAt: '2024-01-14T16:45:00Z'
    },
    {
      id: 3,
      title: 'Client Feedback Session',
      category: 'Client Relations',
      notes: 'Excellent feedback from the Johnson account. They particularly appreciated our proactive communication during the project delays. This should be our standard approach.',
      timeline: '2024-01-12',
      checklist: ['Document best practices', 'Share with team', 'Update client communication guidelines'],
      createdAt: '2024-01-12T14:20:00Z'
    }
  ];

  const categories = ['Team Meetings', 'Self-Reflection', 'Client Relations', 'Strategic Planning', 'Personal Development'];

  const handleCreateEntry = () => {
    if (!newEntry.title || !newEntry.notes) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the title and notes.",
      });
      return;
    }

    toast({
      title: "Diary Entry Created!",
      description: "Your reflection has been saved.",
    });

    setNewEntry({
      title: '',
      category: '',
      notes: '',
      timeline: '',
      checklist: ['']
    });
    setShowCreateForm(false);
  };

  const addChecklistItem = () => {
    setNewEntry({
      ...newEntry,
      checklist: [...newEntry.checklist, '']
    });
  };

  const updateChecklistItem = (index: number, value: string) => {
    const updatedChecklist = [...newEntry.checklist];
    updatedChecklist[index] = value;
    setNewEntry({
      ...newEntry,
      checklist: updatedChecklist
    });
  };

  const removeChecklistItem = (index: number) => {
    const updatedChecklist = newEntry.checklist.filter((_, i) => i !== index);
    setNewEntry({
      ...newEntry,
      checklist: updatedChecklist.length > 0 ? updatedChecklist : ['']
    });
  };

  const filteredEntries = diaryEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole="ceo" userName="Sarah Johnson" />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Diary</h1>
                  <p className="text-gray-600">Private reflections and insights</p>
                </div>
              </div>
              
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search entries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Form */}
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Diary Entry</CardTitle>
                  <CardDescription>Record your thoughts, reflections, and action items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entry-title">Title *</Label>
                      <Input
                        id="entry-title"
                        placeholder="e.g., Team Retrospective Meeting"
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="entry-category">Category</Label>
                      <Select onValueChange={(value) => setNewEntry({...newEntry, category: value})}>
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
                        value={newEntry.timeline}
                        onChange={(e) => setNewEntry({...newEntry, timeline: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="entry-notes">Notes & Reflections *</Label>
                    <Textarea
                      id="entry-notes"
                      placeholder="Write your thoughts, observations, and reflections..."
                      rows={6}
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Action Items Checklist</Label>
                    {newEntry.checklist.map((item, index) => (
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
                    <Button onClick={handleCreateEntry}>Save Entry</Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Diary Entries */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedCategory !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Start your reflective journey by creating your first diary entry'
                      }
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{entry.title}</CardTitle>
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {entry.category}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {entry.timeline}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 leading-relaxed">{entry.notes}</p>
                      
                      {entry.checklist.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Action Items:</h4>
                          <div className="space-y-2">
                            {entry.checklist.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox />
                                <span className="text-sm text-gray-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Diary;

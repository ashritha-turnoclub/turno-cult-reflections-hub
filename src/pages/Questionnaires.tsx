
import { useState } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle,
  Users,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Questionnaires = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    title: '',
    quarter: '',
    year: new Date().getFullYear().toString(),
    deadline: '',
    description: ''
  });
  const { toast } = useToast();

  // Mock data
  const questionnaires = [
    {
      id: 1,
      title: 'Q4 Leadership Assessment',
      quarter: 'Q4',
      year: 2024,
      deadline: '2024-01-15',
      status: 'published',
      responses: 8,
      totalAssigned: 12,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      title: 'Team Collaboration Review',
      quarter: 'Q4',
      year: 2024,
      deadline: '2024-01-20',
      status: 'draft',
      responses: 0,
      totalAssigned: 0,
      createdAt: '2024-01-05'
    },
    {
      id: 3,
      title: 'Q3 Performance Reflection',
      quarter: 'Q3',
      year: 2024,
      deadline: '2023-12-15',
      status: 'completed',
      responses: 15,
      totalAssigned: 15,
      createdAt: '2023-11-01'
    }
  ];

  const handleCreateQuestionnaire = () => {
    if (!newQuestionnaire.title || !newQuestionnaire.quarter || !newQuestionnaire.deadline) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    toast({
      title: "Questionnaire Created!",
      description: "Your questionnaire has been saved as a draft.",
    });

    setNewQuestionnaire({
      title: '',
      quarter: '',
      year: new Date().getFullYear().toString(),
      deadline: '',
      description: ''
    });
    setShowCreateForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

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
                  <h1 className="text-3xl font-bold text-gray-900">Questionnaires</h1>
                  <p className="text-gray-600">Create and manage team assessments</p>
                </div>
              </div>
              
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Questionnaire
              </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Questionnaire</CardTitle>
                  <CardDescription>Set up a new assessment for your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Q4 Leadership Assessment"
                        value={newQuestionnaire.title}
                        onChange={(e) => setNewQuestionnaire({...newQuestionnaire, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quarter">Quarter *</Label>
                      <Select onValueChange={(value) => setNewQuestionnaire({...newQuestionnaire, quarter: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quarter" />
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
                        value={newQuestionnaire.year}
                        onChange={(e) => setNewQuestionnaire({...newQuestionnaire, year: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newQuestionnaire.deadline}
                        onChange={(e) => setNewQuestionnaire({...newQuestionnaire, deadline: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this questionnaire's purpose..."
                      rows={3}
                      value={newQuestionnaire.description}
                      onChange={(e) => setNewQuestionnaire({...newQuestionnaire, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={handleCreateQuestionnaire}>Create Questionnaire</Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questionnaires List */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">All Questionnaires</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4">
                  {questionnaires.map((questionnaire) => (
                    <Card key={questionnaire.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{questionnaire.title}</h3>
                              <Badge className={getStatusColor(questionnaire.status)}>
                                {getStatusIcon(questionnaire.status)}
                                <span className="ml-1 capitalize">{questionnaire.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{questionnaire.quarter} {questionnaire.year}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Due: {questionnaire.deadline}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{questionnaire.responses}/{questionnaire.totalAssigned} responses</span>
                              </div>
                            </div>
                            
                            {questionnaire.status === 'published' && (
                              <div className="mt-3">
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(questionnaire.responses / questionnaire.totalAssigned) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="draft">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No draft questionnaires</h3>
                  <p className="text-gray-600 mb-4">Create a new questionnaire to get started</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Questionnaire
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Questionnaires;

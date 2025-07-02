
import { useState } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { QuestionnaireDrafts } from '@/components/Questionnaires/QuestionnaireDrafts';
import { QuestionnaireEditor } from '@/components/Questionnaires/QuestionnaireEditor';
import { LeaderQuestionnaires } from '@/components/Questionnaires/LeaderQuestionnaires';
import { ResponseReview } from '@/components/Questionnaires/ResponseReview';
import { NotificationBell } from '@/components/Notifications/NotificationBell';

const Questionnaires = () => {
  const { userProfile } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [editingQuestionnaireId, setEditingQuestionnaireId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setEditingQuestionnaireId(undefined);
    setActiveView('editor');
  };

  const handleEditDraft = (draftId: string) => {
    setEditingQuestionnaireId(draftId);
    setActiveView('editor');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setEditingQuestionnaireId(undefined);
  };

  const handleSave = () => {
    setActiveView('list');
    setEditingQuestionnaireId(undefined);
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">Questionnaires</h1>
                  <p className="text-gray-600">
                    {userProfile?.role === 'ceo' 
                      ? "Create and manage team questionnaires" 
                      : "Complete your assigned questionnaires"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />
                {userProfile?.role === 'ceo' && activeView === 'list' && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Questionnaire
                  </Button>
                )}
              </div>
            </div>

            {userProfile?.role === 'ceo' ? (
              activeView === 'editor' ? (
                <QuestionnaireEditor
                  questionnaireId={editingQuestionnaireId}
                  onBack={handleBackToList}
                  onSave={handleSave}
                />
              ) : (
                <Tabs defaultValue="drafts" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="drafts">My Questionnaires</TabsTrigger>
                    <TabsTrigger value="responses">Review Responses</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="drafts">
                    <QuestionnaireDrafts
                      key={refreshKey}
                      onEditDraft={handleEditDraft}
                      onRefresh={handleRefresh}
                    />
                  </TabsContent>
                  
                  <TabsContent value="responses">
                    <ResponseReview />
                  </TabsContent>
                </Tabs>
              )
            ) : (
              <LeaderQuestionnaires />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Questionnaires;


import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { QuestionnaireBuilder } from '@/components/Questionnaires/QuestionnaireBuilder';
import { LeaderQuestionnaires } from '@/components/Questionnaires/LeaderQuestionnaires';
import { ResponseReview } from '@/components/Questionnaires/ResponseReview';

const Questionnaires = () => {
  const { userProfile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Questionnaires</h1>
                <p className="text-gray-600">
                  {userProfile?.role === 'ceo' 
                    ? "Create and manage team questionnaires" 
                    : "Complete your assigned questionnaires"
                  }
                </p>
              </div>
            </div>

            {userProfile?.role === 'ceo' ? (
              <Tabs defaultValue="builder" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="builder">Questionnaire Builder</TabsTrigger>
                  <TabsTrigger value="responses">Review Responses</TabsTrigger>
                </TabsList>
                
                <TabsContent value="builder">
                  <QuestionnaireBuilder />
                </TabsContent>
                
                <TabsContent value="responses">
                  <ResponseReview />
                </TabsContent>
              </Tabs>
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

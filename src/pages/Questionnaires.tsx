
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/hooks/useAuth';
import { QuestionnaireBuilder } from '@/components/Questionnaires/QuestionnaireBuilder';
import { LeaderQuestionnaires } from '@/components/Questionnaires/LeaderQuestionnaires';

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
              <QuestionnaireBuilder />
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

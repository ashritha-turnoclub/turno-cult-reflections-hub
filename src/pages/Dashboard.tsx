
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from '@/hooks/useAuth';
import { DashboardMetrics } from '@/components/Dashboard/DashboardMetrics';

const Dashboard = () => {
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
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {userProfile?.name}!
                </h1>
                <p className="text-gray-600">
                  {userProfile?.role === 'ceo' 
                    ? "Here's an overview of your team's progress" 
                    : "Here's your personalized dashboard"
                  }
                </p>
              </div>
            </div>

            <DashboardMetrics />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;


import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Brain,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  userRole?: 'ceo' | 'leader';
  userName?: string;
}

export function AppSidebar({ userRole = 'ceo', userName = 'John Doe' }: AppSidebarProps) {
  const [activeItem, setActiveItem] = useState('dashboard');
  const { signOut } = useAuth();

  const ceoMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      id: 'dashboard'
    },
    {
      title: "Team Management",
      url: "/team",
      icon: Users,
      id: 'team'
    },
    {
      title: "Questionnaires",
      url: "/questionnaires",
      icon: FileText,
      id: 'questionnaires'
    },
    {
      title: "My Diary",
      url: "/diary",
      icon: BookOpen,
      id: 'diary'
    },
    {
      title: "Progress Tracker",
      url: "/progress",
      icon: TrendingUp,
      id: 'progress'
    },
    {
      title: "AI Insights",
      url: "/ai-insights",
      icon: Brain,
      id: 'ai-insights'
    },
  ];

  const leaderMenuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      id: 'dashboard'
    },
    {
      title: "Assigned Tasks",
      url: "/assignments",
      icon: FileText,
      id: 'assignments'
    },
    {
      title: "My Diary",
      url: "/diary",
      icon: BookOpen,
      id: 'diary'
    },
    {
      title: "Progress Tracker",
      url: "/progress",
      icon: TrendingUp,
      id: 'progress'
    },
    {
      title: "AI Insights",
      url: "/ai-insights",
      icon: Brain,
      id: 'ai-insights'
    },
  ];

  const menuItems = userRole === 'ceo' ? ceoMenuItems : leaderMenuItems;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-2">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Turno.Cult</h2>
            <p className="text-sm text-gray-500">Leadership Tracker</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeItem === item.id}
                    onClick={() => setActiveItem(item.id)}
                    className="w-full justify-start"
                  >
                    <a href={item.url} className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <div className="flex items-center space-x-2">
                <Badge variant={userRole === 'ceo' ? 'default' : 'secondary'} className="text-xs">
                  {userRole === 'ceo' ? 'CEO' : 'Leader'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

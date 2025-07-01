
import { useState, useEffect } from "react";
import { Calendar, ChevronUp, Home, User2, FileText, BookOpen, Target, Brain, Settings, Users, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/Notifications/NotificationBell";

interface AppSidebarProps {
  userRole?: string;
  userName?: string;
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
      },
      {
        title: "Diary",
        url: "/diary",
        icon: BookOpen,
      },
      {
        title: "Progress Tracker",
        url: "/progress",
        icon: Target,
      },
      {
        title: "AI Insights",
        url: "/ai-insights",
        icon: Brain,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ];

    if (userRole === 'ceo') {
      return [
        ...commonItems.slice(0, 1), // Dashboard
        {
          title: "Questionnaires",
          url: "/questionnaires",
          icon: FileText,
        },
        {
          title: "Team Management",
          url: "/team",
          icon: Users,
        },
        ...commonItems.slice(1), // Rest of the items
      ];
    } else {
      return [
        ...commonItems.slice(0, 1), // Dashboard
        {
          title: "Questionnaires",
          url: "/questionnaires",
          icon: FileText,
        },
        ...commonItems.slice(1), // Rest of the items
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">LeaderSync</span>
              <span className="truncate text-xs">Performance Platform</span>
            </div>
          </div>
          <NotificationBell />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {userName || "User"}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => signOut()}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

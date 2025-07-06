
import { useState } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { DiaryList } from '@/components/Diary/DiaryList';
import { DiaryForm } from '@/components/Diary/DiaryForm';
import { NotificationBell } from '@/components/Notifications/NotificationBell';
import { useSearch } from '@/hooks/useSearch';

interface ActionItem {
  title: string;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
}

interface DiaryEntry {
  id?: string;
  title: string;
  category: string;
  notes: string;
  timeline: string;
  checklist: ActionItem[];
  tags: string[];
}

const Diary = () => {
  const { userProfile } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const sortOptions = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'timeline-asc', label: 'Timeline (Earliest)' },
    { value: 'timeline-desc', label: 'Timeline (Latest)' },
    { value: 'created_at-desc', label: 'Created (Newest)' },
    { value: 'created_at-asc', label: 'Created (Oldest)' },
    { value: 'tags-asc', label: 'Tags (A-Z)' },
    { value: 'tags-desc', label: 'Tags (Z-A)' }
  ];

  const handleCreateNew = () => {
    setEditingEntry(undefined);
    setActiveView('form');
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setActiveView('form');
  };

  const handleSaveEntry = () => {
    setActiveView('list');
    setEditingEntry(undefined);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setActiveView('list');
    setEditingEntry(undefined);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
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
              
              <div className="flex items-center space-x-4">
                <NotificationBell />
                {activeView === 'list' && (
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Entry
                  </Button>
                )}
              </div>
            </div>

            {activeView === 'form' ? (
              <DiaryForm
                entry={editingEntry}
                onSave={handleSaveEntry}
                onCancel={handleCancelForm}
              />
            ) : (
              <>
                <DiaryList
                  onEditEntry={handleEditEntry}
                  refreshKey={refreshKey}
                  sortOptions={sortOptions}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Diary;

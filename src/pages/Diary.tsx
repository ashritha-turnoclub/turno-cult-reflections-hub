
import { useState } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { DiaryList } from '@/components/Diary/DiaryList';
import { DiaryForm } from '@/components/Diary/DiaryForm';

interface DiaryEntry {
  id?: string;
  title: string;
  category: string;
  notes: string;
  timeline: string;
  checklist: string[];
}

const Diary = () => {
  const { userProfile } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = [
    'Team Meetings',
    'Self-Reflection', 
    'Client Relations',
    'Strategic Planning',
    'Personal Development',
    'Leadership Growth',
    'Goal Setting'
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
              
              {activeView === 'list' && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              )}
            </div>

            {activeView === 'form' ? (
              <DiaryForm
                entry={editingEntry}
                onSave={handleSaveEntry}
                onCancel={handleCancelForm}
              />
            ) : (
              <>
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

                {/* Diary Entries List */}
                <DiaryList
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  onEditEntry={handleEditEntry}
                  refreshKey={refreshKey}
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

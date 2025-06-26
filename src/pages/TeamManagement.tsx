
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Mail, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TeamManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isAddingLeader, setIsAddingLeader] = useState(false);
  const [newLeader, setNewLeader] = useState({
    name: '',
    email: '',
    role_title: '',
    role_description: ''
  });

  useEffect(() => {
    if (userProfile?.role === 'ceo') {
      fetchLeaders();
    }
  }, [userProfile]);

  const fetchLeaders = async () => {
    const { data, error } = await supabase
      .from('leaders')
      .select('*')
      .eq('ceo_id', userProfile?.id)
      .order('invited_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching leaders",
        description: error.message,
      });
    } else {
      setLeaders(data || []);
    }
  };

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLeader.email.endsWith('@turno.club')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Only @turno.club emails are allowed.",
      });
      return;
    }

    const { error } = await supabase
      .from('leaders')
      .insert([{
        ceo_id: userProfile?.id,
        name: newLeader.name,
        email: newLeader.email,
        role_title: newLeader.role_title,
        role_description: newLeader.role_description
      }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding leader",
        description: error.message,
      });
    } else {
      toast({
        title: "Leader invited successfully",
        description: `Invitation sent to ${newLeader.email}`,
      });
      setNewLeader({ name: '', email: '', role_title: '', role_description: '' });
      setIsAddingLeader(false);
      fetchLeaders();
    }
  };

  if (userProfile?.role !== 'ceo') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only CEOs can access team management.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                  <p className="text-gray-600">Manage your leadership team</p>
                </div>
              </div>
              
              <Dialog open={isAddingLeader} onOpenChange={setIsAddingLeader}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Leader
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Leader</DialogTitle>
                    <DialogDescription>
                      Invite a new leader to join your team
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddLeader} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newLeader.name}
                        onChange={(e) => setNewLeader({...newLeader, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="leader@turno.club"
                        value={newLeader.email}
                        onChange={(e) => setNewLeader({...newLeader, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_title">Role Title</Label>
                      <Input
                        id="role_title"
                        placeholder="e.g., Head of Marketing"
                        value={newLeader.role_title}
                        onChange={(e) => setNewLeader({...newLeader, role_title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_description">Role Description</Label>
                      <Textarea
                        id="role_description"
                        placeholder="Brief description of responsibilities..."
                        value={newLeader.role_description}
                        onChange={(e) => setNewLeader({...newLeader, role_description: e.target.value})}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">Send Invitation</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddingLeader(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {leaders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Start building your leadership team by inviting members
                    </p>
                    <Button onClick={() => setIsAddingLeader(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Leader
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaders.map((leader) => (
                    <Card key={leader.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{leader.name}</CardTitle>
                          <Badge variant={leader.accepted_at ? "default" : "secondary"}>
                            {leader.accepted_at ? <CheckCircle className="h-3 w-3 mr-1" /> : <Calendar className="h-3 w-3 mr-1" />}
                            {leader.accepted_at ? "Active" : "Pending"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {leader.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {leader.role_title && (
                          <div className="mb-2">
                            <h4 className="font-medium text-sm text-gray-700">Role</h4>
                            <p className="text-sm text-gray-900">{leader.role_title}</p>
                          </div>
                        )}
                        {leader.role_description && (
                          <div className="mb-4">
                            <h4 className="font-medium text-sm text-gray-700">Description</h4>
                            <p className="text-sm text-gray-600">{leader.role_description}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Invited {new Date(leader.invited_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TeamManagement;

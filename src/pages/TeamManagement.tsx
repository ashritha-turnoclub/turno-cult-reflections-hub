
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
import { Plus, Users, Mail, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TeamManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isAddingLeader, setIsAddingLeader] = useState(false);
  const [loading, setLoading] = useState(false);
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
    try {
      setLoading(true);
      // Fetch both invited leaders and actual users who have joined
      const { data: leadersData, error: leadersError } = await supabase
        .from('leaders')
        .select('*')
        .eq('ceo_id', userProfile?.id)
        .order('invited_at', { ascending: false });

      if (leadersError) throw leadersError;

      // For each leader, check if they have a user account
      const leadersWithStatus = await Promise.all(
        (leadersData || []).map(async (leader) => {
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('email', leader.email)
            .eq('role', 'leader')
            .maybeSingle();

          return {
            ...leader,
            user: userData,
            status: userData ? 'active' : 'pending'
          };
        })
      );

      setLeaders(leadersWithStatus);
    } catch (error) {
      console.error('Error fetching leaders:', error);
      toast({
        variant: "destructive",
        title: "Error fetching leaders",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if leader already exists
      const { data: existingLeader } = await supabase
        .from('leaders')
        .select('id')
        .eq('email', newLeader.email)
        .eq('ceo_id', userProfile?.id)
        .maybeSingle();

      if (existingLeader) {
        toast({
          variant: "destructive",
          title: "Leader already invited",
          description: "This email has already been invited to your team.",
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

      if (error) throw error;

      toast({
        title: "Leader invited successfully",
        description: `${newLeader.name} can now sign up using ${newLeader.email} and will automatically join your team.`,
      });
      
      setNewLeader({ name: '', email: '', role_title: '', role_description: '' });
      setIsAddingLeader(false);
      fetchLeaders();
    } catch (error) {
      console.error('Error adding leader:', error);
      toast({
        variant: "destructive",
        title: "Error inviting leader",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userProfile?.role !== 'ceo') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
                  <p className="text-gray-600">Manage your leadership team and track their progress</p>
                </div>
              </div>
              
              <Dialog open={isAddingLeader} onOpenChange={setIsAddingLeader}>
                <DialogTrigger asChild>
                  <Button disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Leader
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New Leader</DialogTitle>
                    <DialogDescription>
                      Add a new leader to your team. They'll be able to sign up and automatically join your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddLeader} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newLeader.name}
                        onChange={(e) => setNewLeader({...newLeader, name: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="leader@company.com"
                        value={newLeader.email}
                        onChange={(e) => setNewLeader({...newLeader, email: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_title">Role Title</Label>
                      <Input
                        id="role_title"
                        placeholder="e.g., Head of Marketing"
                        value={newLeader.role_title}
                        onChange={(e) => setNewLeader({...newLeader, role_title: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_description">Role Description</Label>
                      <Textarea
                        id="role_description"
                        placeholder="Brief description of responsibilities..."
                        value={newLeader.role_description}
                        onChange={(e) => setNewLeader({...newLeader, role_description: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Sending..." : "Send Invitation"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingLeader(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {loading && leaders.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </CardContent>
                </Card>
              ) : leaders.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                    <p className="text-gray-600 text-center mb-4">
                      Start building your leadership team by inviting members
                    </p>
                    <Button onClick={() => setIsAddingLeader(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invite First Leader
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
                          <Badge variant={leader.status === 'active' ? "default" : "secondary"}>
                            {leader.status === 'active' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
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
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Invited: {new Date(leader.invited_at).toLocaleDateString()}</div>
                          {leader.user && (
                            <div className="text-green-600">
                              ✓ Joined: {new Date(leader.user.created_at).toLocaleDateString()}
                            </div>
                          )}
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


import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, X, Plus } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Collaborator {
  user_id: string;
  role: 'ceo' | 'leader';
  permission: 'view' | 'edit';
  name?: string;
  email?: string;
}

interface CollaboratorSelectorProps {
  collaborators: Collaborator[];
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
}

export const CollaboratorSelector = ({ collaborators, onCollaboratorsChange }: CollaboratorSelectorProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'ceo') {
      fetchAvailableUsers();
    }
  }, [userProfile]);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users except current user
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .neq('id', userProfile?.id);

      if (usersError) throw usersError;

      // If current user is CEO, also fetch leaders they manage
      if (userProfile?.role === 'ceo') {
        const { data: leaders, error: leadersError } = await supabase
          .from('leaders')
          .select('*')
          .eq('ceo_id', userProfile.id);

        if (leadersError) throw leadersError;

        // Combine users with leader information
        const combinedUsers = users?.map(user => {
          const leaderInfo = leaders?.find(leader => leader.email === user.email);
          return {
            ...user,
            isManaged: !!leaderInfo
          };
        }) || [];

        setAvailableUsers(combinedUsers);
      } else {
        setAvailableUsers(users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available users.",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = () => {
    if (!selectedUserId) return;

    const user = availableUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    const newCollaborator: Collaborator = {
      user_id: selectedUserId,
      role: user.role,
      permission: selectedPermission,
      name: user.name,
      email: user.email
    };

    const updatedCollaborators = [...collaborators, newCollaborator];
    onCollaboratorsChange(updatedCollaborators);
    
    setSelectedUserId('');
    setSelectedPermission('view');
  };

  const removeCollaborator = (userId: string) => {
    const updatedCollaborators = collaborators.filter(c => c.user_id !== userId);
    onCollaboratorsChange(updatedCollaborators);
  };

  const updateCollaboratorPermission = (userId: string, permission: 'view' | 'edit') => {
    const updatedCollaborators = collaborators.map(c => 
      c.user_id === userId ? { ...c, permission } : c
    );
    onCollaboratorsChange(updatedCollaborators);
  };

  // Only show for CEOs
  if (userProfile?.role !== 'ceo') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Add Collaborator</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter(user => !collaborators.some(c => c.user_id === user.id))
                  .map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Permission</Label>
            <Select value={selectedPermission} onValueChange={(value: 'view' | 'edit') => setSelectedPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Edit Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button 
              onClick={addCollaborator} 
              disabled={!selectedUserId || loading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {collaborators.length > 0 && (
          <div className="space-y-2">
            <Label>Current Collaborators</Label>
            <div className="space-y-2">
              {collaborators.map(collaborator => (
                <div key={collaborator.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{collaborator.name}</p>
                      <p className="text-sm text-gray-500">{collaborator.email} - {collaborator.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={collaborator.permission} 
                      onValueChange={(value: 'view' | 'edit') => updateCollaboratorPermission(collaborator.user_id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="edit">Edit Access</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCollaborator(collaborator.user_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

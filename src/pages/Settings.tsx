
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Lock, Settings as SettingsIcon, Save, KeyRound } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        email: userProfile.email || ''
      });
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    try {
      setLoading(true);
      
      // Update user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          email: profileData.email
        })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // Update email in auth if changed
      if (profileData.email !== userProfile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email
        });

        if (emailError) throw emailError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match.",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userProfile?.role} userName={userProfile?.name} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
              </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Account Details
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={userProfile?.role?.toUpperCase() || 'Unknown'}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500">
                          Your role cannot be changed. Contact your administrator if you need to change your role.
                        </p>
                      </div>

                      <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-gray-500">
                            Last changed: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <KeyRound className="h-4 w-4 mr-2" />
                              Change Password
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                              <DialogDescription>
                                Enter your new password below. Make sure it's strong and secure.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                  id="confirm-password"
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                  required
                                />
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button type="submit" disabled={loading} className="flex-1">
                                  {loading ? "Updating..." : "Update Password"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowChangePassword(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;

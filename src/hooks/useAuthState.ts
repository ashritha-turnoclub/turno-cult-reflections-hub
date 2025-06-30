
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && session.user.email_confirmed_at) {
          // Only fetch profile for confirmed users
          setTimeout(async () => {
            try {
              // First, check if user exists in users table
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking user profile:', checkError);
              }
              
              // If user doesn't exist in users table, create them
              if (!existingUser) {
                console.log('User not found in users table, creating entry...');
                
                // Get role from metadata or default to leader
                const userRole = session.user.user_metadata?.role || 'leader';
                const userName = session.user.user_metadata?.name || session.user.email!.split('@')[0];
                
                const { data: newUser, error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    email: session.user.email!,
                    name: userName,
                    role: userRole
                  })
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('Error creating user profile:', insertError);
                  // Try to handle the error gracefully
                  if (insertError.code === '23505') {
                    // User already exists, try to fetch again
                    const { data: retryUser } = await supabase
                      .from('users')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();
                    
                    if (retryUser) {
                      console.log('User profile found on retry:', retryUser);
                      setUserProfile(retryUser);
                    }
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Profile creation error",
                      description: "There was an issue creating your profile. Please refresh the page.",
                    });
                  }
                } else {
                  console.log('User profile created successfully:', newUser);
                  setUserProfile(newUser);
                }
              } else {
                console.log('User profile loaded:', existingUser);
                setUserProfile(existingUser);
              }
            } catch (err) {
              console.error('Profile fetch error:', err);
              toast({
                variant: "destructive",
                title: "Profile error",
                description: "Unable to load your profile. Please refresh the page.",
              });
            }
          }, 100);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email || 'No session');
      if (session && !session.user.email_confirmed_at) {
        console.log('User email not confirmed yet');
        toast({
          variant: "destructive",
          title: "Email confirmation required",
          description: "Please check your email and click the confirmation link before signing in.",
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  return {
    user,
    session,
    userProfile,
    loading,
    setUser,
    setSession,
    setUserProfile,
    setLoading
  };
};

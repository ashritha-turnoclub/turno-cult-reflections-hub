
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
              
              if (checkError) {
                console.error('Error checking user profile:', checkError);
              }
              
              // If user doesn't exist in users table, create them
              if (!existingUser && session.user.user_metadata) {
                console.log('User not found in users table, creating entry...');
                const { data: newUser, error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                    role: session.user.user_metadata.role || 'leader'
                  })
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('Error creating user profile:', insertError);
                  toast({
                    variant: "destructive",
                    title: "Profile creation error",
                    description: "There was an issue creating your profile. Please try signing in again.",
                  });
                } else {
                  console.log('User profile created successfully:', newUser);
                  setUserProfile(newUser);
                }
              } else if (existingUser) {
                console.log('User profile loaded:', existingUser);
                setUserProfile(existingUser);
              }
            } catch (err) {
              console.error('Profile fetch error:', err);
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


import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cleanup function to clear auth state
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
        
        if (session?.user) {
          // Defer profile fetching to avoid potential deadlocks
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching user profile:', error);
              } else {
                console.log('User profile loaded:', profile);
                setUserProfile(profile);
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
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateEmail = (email: string) => {
    const isValid = email.endsWith('@turno.club');
    console.log('Email validation:', email, 'Valid:', isValid);
    return isValid;
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('Starting signup process for:', email);
    
    if (!validateEmail(email)) {
      const error = { message: 'Only @turno.club emails are allowed to sign up.' };
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
      return { error };
    }

    try {
      // Clean up any existing state
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message,
        });
      } else if (data.user) {
        console.log('Signup successful for:', data.user.email);
        toast({
          title: "Account created successfully",
          description: "Welcome! You can now access your dashboard.",
        });
        // Small delay to ensure profile is created
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }

      return { error };
    } catch (err: any) {
      console.error('Sign up error:', err);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Starting signin process for:', email);
    
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('Previous session cleared');
      } catch (err) {
        console.log('No previous session to clear');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Signin response:', { data, error });

      if (error) {
        console.error('Signin error:', error);
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message,
        });
      } else if (data.user) {
        console.log('Signin successful for:', data.user.email);
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        // Small delay to ensure profile is loaded
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }

      return { error };
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('Starting signout process...');
    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      toast({
        title: "Signed out successfully",
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description: "There was an issue signing out. Please try again.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

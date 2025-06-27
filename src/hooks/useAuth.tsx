
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
  resendConfirmation: (email: string) => Promise<{ error: any }>;
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
        
        if (session?.user && session.user.email_confirmed_at) {
          // Only fetch profile for confirmed users
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching user profile:', error);
                // If profile doesn't exist, user might need to complete signup
                if (error.code === 'PGRST116') {
                  toast({
                    variant: "destructive",
                    title: "Profile not found",
                    description: "Please complete your registration process.",
                  });
                }
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
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Too many attempts",
            description: "Please wait a moment before trying again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
          });
        }
      } else if (data.user) {
        if (data.user.email_confirmed_at) {
          console.log('Signup successful and confirmed for:', data.user.email);
          toast({
            title: "Account created successfully",
            description: "Welcome! You can now access your dashboard.",
          });
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          console.log('Signup successful, awaiting confirmation for:', data.user.email);
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link. Please click it to activate your account.",
          });
        }
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
        if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link first.",
            action: {
              altText: "Resend confirmation",
              onClick: () => resendConfirmation(email)
            }
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign In Failed",
            description: error.message,
          });
        }
      } else if (data.user && data.session) {
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

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to resend",
          description: error.message,
        });
      } else {
        toast({
          title: "Confirmation email sent",
          description: "Please check your email for the confirmation link.",
        });
      }

      return { error };
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend confirmation email.",
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
      signOut,
      resendConfirmation
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

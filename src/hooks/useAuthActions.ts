
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState, validateEmail } from '@/utils/authUtils';

export const useAuthActions = () => {
  const { toast } = useToast();

  const signUp = async (email: string, password: string, name: string, role: 'ceo' | 'leader' = 'leader') => {
    console.log('Starting signup process for:', email, 'with role:', role);
    
    if (!validateEmail(email)) {
      const error = { message: 'Please enter a valid email address.' };
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
      return { error };
    }

    try {
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name,
            role // Pass role in metadata for the trigger function
          },
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
          
          // Manually insert user into users table if auto-trigger failed
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name: name,
                role: role
              });
            
            if (insertError) {
              console.error('Manual user insert error:', insertError);
            } else {
              console.log('User manually inserted into users table');
            }
          } catch (insertErr) {
            console.error('Manual insert failed:', insertErr);
          }
          
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
      cleanupAuthState();
      
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

  return {
    signUp,
    signIn,
    signOut,
    resendConfirmation
  };
};

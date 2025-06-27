
import { createContext, useContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    session,
    userProfile,
    loading
  } = useAuthState();

  const {
    signUp,
    signIn,
    signOut,
    resendConfirmation
  } = useAuthActions();

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

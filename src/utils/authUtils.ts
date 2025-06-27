
// Cleanup function to clear auth state
export const cleanupAuthState = () => {
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

export const validateEmail = (email: string) => {
  const isValid = email.endsWith('@turno.club');
  console.log('Email validation:', email, 'Valid:', isValid);
  return isValid;
};

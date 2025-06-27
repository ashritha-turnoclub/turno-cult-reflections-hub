
-- Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "CEOs can view all users" ON public.users;

-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a new policy using the security definer function
CREATE POLICY "CEOs can view all users" ON public.users
  FOR SELECT USING (public.get_current_user_role() = 'ceo');

-- Also fix the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user (CEO) by counting existing users
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Insert the new user profile
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE WHEN user_count = 0 THEN 'ceo'::user_role ELSE 'leader'::user_role END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the signup
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

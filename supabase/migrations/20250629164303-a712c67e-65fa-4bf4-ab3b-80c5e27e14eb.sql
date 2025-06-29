
-- First, let's clean up all existing policies to avoid conflicts
DROP POLICY IF EXISTS "CEOs can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "CEOs can manage leaders" ON public.leaders;
DROP POLICY IF EXISTS "Leaders can view their own record" ON public.leaders;
DROP POLICY IF EXISTS "CEOs can manage questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Leaders can view published questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "CEOs can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Leaders can view questions of published questionnaires" ON public.questions;
DROP POLICY IF EXISTS "CEOs can manage assignments" ON public.questionnaire_assignments;
DROP POLICY IF EXISTS "Leaders can view their assignments" ON public.questionnaire_assignments;
DROP POLICY IF EXISTS "Leaders can update their assignments" ON public.questionnaire_assignments;
DROP POLICY IF EXISTS "CEOs can view all answers" ON public.answers;
DROP POLICY IF EXISTS "Leaders can manage their own answers" ON public.answers;
DROP POLICY IF EXISTS "CEOs can manage feedback comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Leaders can view and reply to feedback on their submissions" ON public.feedback_comments;
DROP POLICY IF EXISTS "Users can manage their own diary entries" ON public.diary_entries;
DROP POLICY IF EXISTS "Users can manage their own focus areas" ON public.focus_areas;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Update the handle_new_user function to remove email restrictions and allow role selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user profile with role from metadata
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'leader'::user_role)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block the signup
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "CEOs can view all users" ON public.users
  FOR SELECT USING (public.get_current_user_role() = 'ceo');

-- Leaders table policies
CREATE POLICY "CEOs can manage leaders" ON public.leaders
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view their own record" ON public.leaders
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE email = leaders.email));

-- Questionnaires policies
CREATE POLICY "CEOs can manage questionnaires" ON public.questionnaires
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view published questionnaires" ON public.questionnaires
  FOR SELECT USING (published = true AND public.get_current_user_role() = 'leader');

-- Questions policies
CREATE POLICY "CEOs can manage questions" ON public.questions
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view questions of published questionnaires" ON public.questions
  FOR SELECT USING (
    questionnaire_id IN (
      SELECT id FROM public.questionnaires WHERE published = true
    ) AND public.get_current_user_role() = 'leader'
  );

-- Questionnaire assignments policies
CREATE POLICY "CEOs can manage assignments" ON public.questionnaire_assignments
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view their assignments" ON public.questionnaire_assignments
  FOR SELECT USING (leader_id = auth.uid());

CREATE POLICY "Leaders can update their assignments" ON public.questionnaire_assignments
  FOR UPDATE USING (leader_id = auth.uid());

-- Answers policies
CREATE POLICY "CEOs can view all answers" ON public.answers
  FOR SELECT USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can manage their own answers" ON public.answers
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM public.questionnaire_assignments WHERE leader_id = auth.uid()
    )
  );

-- Feedback comments policies
CREATE POLICY "CEOs can manage feedback comments" ON public.feedback_comments
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view and reply to feedback on their submissions" ON public.feedback_comments
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM public.questionnaire_assignments WHERE leader_id = auth.uid()
    )
  );

-- Diary entries policies
CREATE POLICY "Users can manage their own diary entries" ON public.diary_entries
  FOR ALL USING (user_id = auth.uid());

-- Focus areas policies
CREATE POLICY "Users can manage their own focus areas" ON public.focus_areas
  FOR ALL USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Create AI summaries table for future AI insights functionality
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'diary' or 'progress'
  quarter TEXT, -- 'Q1', 'Q2', 'Q3', 'Q4'
  year INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI summaries" ON public.ai_summaries
  FOR ALL USING (user_id = auth.uid());

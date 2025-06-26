
-- Create custom types
CREATE TYPE public.user_role AS ENUM ('ceo', 'leader');
CREATE TYPE public.quarter_type AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');
CREATE TYPE public.notification_type AS ENUM ('assignment', 'feedback', 'submission', 'invitation');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'leader',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create leaders table for team management
CREATE TABLE public.leaders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ceo_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT,
  role_description TEXT,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create questionnaires table
CREATE TABLE public.questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  quarter quarter_type NOT NULL,
  year INTEGER NOT NULL,
  deadline DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  question_title TEXT NOT NULL,
  question_detail TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create questionnaire assignments table
CREATE TABLE public.questionnaire_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(questionnaire_id, leader_id)
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.questionnaire_assignments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, question_id)
);

-- Create feedback comments table
CREATE TABLE public.feedback_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.questionnaire_assignments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  section TEXT,
  comment_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.feedback_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create diary entries table
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  notes TEXT NOT NULL,
  checklist JSONB,
  timeline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create focus areas table
CREATE TABLE public.focus_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  checklist JSONB,
  deadline DATE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  quarter quarter_type,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  ref_id UUID,
  read_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
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

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "CEOs can view all users" ON public.users
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ceo')
  );

-- RLS Policies for leaders table
CREATE POLICY "CEOs can manage their leaders" ON public.leaders
  FOR ALL USING (ceo_id = auth.uid());

-- RLS Policies for questionnaires
CREATE POLICY "CEOs can manage questionnaires" ON public.questionnaires
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Leaders can view assigned questionnaires" ON public.questionnaires
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      WHERE qa.questionnaire_id = id AND qa.leader_id = auth.uid()
    )
  );

-- RLS Policies for questions
CREATE POLICY "CEOs can manage questions" ON public.questions
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.questionnaires q 
      WHERE q.id = questionnaire_id AND q.created_by = auth.uid()
    )
  );

CREATE POLICY "Leaders can view questions for assigned questionnaires" ON public.questions
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      JOIN public.questionnaires q ON q.id = qa.questionnaire_id
      WHERE q.id = questionnaire_id AND qa.leader_id = auth.uid()
    )
  );

-- RLS Policies for questionnaire_assignments
CREATE POLICY "CEOs can manage assignments" ON public.questionnaire_assignments
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.questionnaires q 
      WHERE q.id = questionnaire_id AND q.created_by = auth.uid()
    )
  );

CREATE POLICY "Leaders can view their assignments" ON public.questionnaire_assignments
  FOR SELECT USING (leader_id = auth.uid());

CREATE POLICY "Leaders can update their assignments" ON public.questionnaire_assignments
  FOR UPDATE USING (leader_id = auth.uid());

-- RLS Policies for answers
CREATE POLICY "Users can manage answers for their assignments" ON public.answers
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      WHERE qa.id = assignment_id AND qa.leader_id = auth.uid()
    )
  );

CREATE POLICY "CEOs can view answers to their questionnaires" ON public.answers
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      JOIN public.questionnaires q ON q.id = qa.questionnaire_id
      WHERE qa.id = assignment_id AND q.created_by = auth.uid()
    )
  );

-- RLS Policies for feedback_comments
CREATE POLICY "Users can manage their own comments" ON public.feedback_comments
  FOR ALL USING (comment_by = auth.uid());

CREATE POLICY "Users can view comments on their assignments" ON public.feedback_comments
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      WHERE qa.id = assignment_id AND qa.leader_id = auth.uid()
    ) OR
    EXISTS(
      SELECT 1 FROM public.questionnaire_assignments qa 
      JOIN public.questionnaires q ON q.id = qa.questionnaire_id
      WHERE qa.id = assignment_id AND q.created_by = auth.uid()
    )
  );

-- RLS Policies for diary_entries
CREATE POLICY "Users can manage their own diary entries" ON public.diary_entries
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for focus_areas
CREATE POLICY "Users can manage their own focus areas" ON public.focus_areas
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if this is the first user (CEO)
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE WHEN user_count = 0 THEN 'ceo'::user_role ELSE 'leader'::user_role END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  recipient_id UUID,
  message TEXT,
  type notification_type,
  ref_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (recipient_id, message, type, ref_id)
  VALUES (recipient_id, message, type, ref_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

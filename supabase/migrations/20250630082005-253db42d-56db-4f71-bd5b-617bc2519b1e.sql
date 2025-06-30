
-- Add missing foreign key constraints and update existing tables
ALTER TABLE public.questionnaires 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update questions table to ensure proper foreign key relationship
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS questions_questionnaire_id_fkey;

ALTER TABLE public.questions 
ADD CONSTRAINT questions_questionnaire_id_fkey 
FOREIGN KEY (questionnaire_id) REFERENCES public.questionnaires(id) ON DELETE CASCADE;

-- Update answers table to ensure proper foreign key relationships
ALTER TABLE public.answers 
DROP CONSTRAINT IF EXISTS answers_question_id_fkey,
DROP CONSTRAINT IF EXISTS answers_assignment_id_fkey;

ALTER TABLE public.answers 
ADD CONSTRAINT answers_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
ADD CONSTRAINT answers_assignment_id_fkey 
FOREIGN KEY (assignment_id) REFERENCES public.questionnaire_assignments(id) ON DELETE CASCADE;

-- Update questionnaire_assignments table
ALTER TABLE public.questionnaire_assignments 
DROP CONSTRAINT IF EXISTS questionnaire_assignments_questionnaire_id_fkey,
DROP CONSTRAINT IF EXISTS questionnaire_assignments_leader_id_fkey;

ALTER TABLE public.questionnaire_assignments 
ADD CONSTRAINT questionnaire_assignments_questionnaire_id_fkey 
FOREIGN KEY (questionnaire_id) REFERENCES public.questionnaires(id) ON DELETE CASCADE,
ADD CONSTRAINT questionnaire_assignments_leader_id_fkey 
FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update leaders table to link to users properly
ALTER TABLE public.leaders 
DROP CONSTRAINT IF EXISTS leaders_ceo_id_fkey;

ALTER TABLE public.leaders 
ADD CONSTRAINT leaders_ceo_id_fkey 
FOREIGN KEY (ceo_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update notification enum to include questionnaire_assigned
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'questionnaire_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'leader_joined';

-- Create function to automatically assign questionnaire to all leaders when published
CREATE OR REPLACE FUNCTION public.auto_assign_questionnaire()
RETURNS TRIGGER AS $$
BEGIN
  -- If questionnaire is being published, assign it to all leaders under this CEO
  IF NEW.published = true AND OLD.published = false THEN
    INSERT INTO public.questionnaire_assignments (questionnaire_id, leader_id)
    SELECT NEW.id, u.id
    FROM public.leaders l
    JOIN public.users u ON u.email = l.email
    WHERE l.ceo_id = NEW.created_by
    AND u.role = 'leader';
    
    -- Create notifications for each leader
    INSERT INTO public.notifications (recipient_id, message, type, ref_id)
    SELECT u.id, 
           'New questionnaire "' || NEW.title || '" has been assigned to you for ' || NEW.quarter || ' ' || NEW.year,
           'questionnaire_assigned',
           NEW.id
    FROM public.leaders l
    JOIN public.users u ON u.email = l.email
    WHERE l.ceo_id = NEW.created_by
    AND u.role = 'leader';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS auto_assign_questionnaire_trigger ON public.questionnaires;
CREATE TRIGGER auto_assign_questionnaire_trigger
  AFTER UPDATE ON public.questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_questionnaire();

-- Create function to notify CEO when leader signs up
CREATE OR REPLACE FUNCTION public.notify_ceo_leader_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this user corresponds to an invited leader
  IF NEW.role = 'leader' THEN
    -- Find the CEO who invited this leader
    INSERT INTO public.notifications (recipient_id, message, type, ref_id)
    SELECT l.ceo_id,
           'Leader ' || NEW.name || ' (' || NEW.email || ') has accepted your invitation and joined the team',
           'leader_joined',
           NEW.id
    FROM public.leaders l
    WHERE l.email = NEW.email;
    
    -- Update the leaders table to mark as accepted
    UPDATE public.leaders 
    SET accepted_at = NOW()
    WHERE email = NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for leader signup notification
DROP TRIGGER IF EXISTS notify_ceo_leader_signup_trigger ON public.users;
CREATE TRIGGER notify_ceo_leader_signup_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ceo_leader_signup();

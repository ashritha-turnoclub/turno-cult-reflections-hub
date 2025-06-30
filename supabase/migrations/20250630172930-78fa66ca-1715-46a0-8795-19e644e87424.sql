
-- Update notification_type enum to include missing values
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'questionnaire_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'leader_joined';

-- Ensure all RLS policies are properly set up
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "CEOs can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "CEOs can view all users" ON public.users
  FOR SELECT USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Ensure all other tables have proper RLS policies
DROP POLICY IF EXISTS "CEOs can manage questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Leaders can view published questionnaires" ON public.questionnaires;

CREATE POLICY "CEOs can manage questionnaires" ON public.questionnaires
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view published questionnaires" ON public.questionnaires
  FOR SELECT USING (published = true AND public.get_current_user_role() = 'leader');

-- Questions policies
DROP POLICY IF EXISTS "CEOs can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Leaders can view questions of published questionnaires" ON public.questions;

CREATE POLICY "CEOs can manage questions" ON public.questions
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view questions of published questionnaires" ON public.questions
  FOR SELECT USING (
    questionnaire_id IN (
      SELECT id FROM public.questionnaires WHERE published = true
    ) AND public.get_current_user_role() = 'leader'
  );

-- Questionnaire assignments policies
DROP POLICY IF EXISTS "CEOs can manage assignments" ON public.questionnaire_assignments;
DROP POLICY IF EXISTS "Leaders can view their assignments" ON public.questionnaire_assignments;
DROP POLICY IF EXISTS "Leaders can update their assignments" ON public.questionnaire_assignments;

CREATE POLICY "CEOs can manage assignments" ON public.questionnaire_assignments
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view their assignments" ON public.questionnaire_assignments
  FOR SELECT USING (leader_id = auth.uid());

CREATE POLICY "Leaders can update their assignments" ON public.questionnaire_assignments
  FOR UPDATE USING (leader_id = auth.uid());

-- Answers policies
DROP POLICY IF EXISTS "CEOs can view all answers" ON public.answers;
DROP POLICY IF EXISTS "Leaders can manage their own answers" ON public.answers;

CREATE POLICY "CEOs can view all answers" ON public.answers
  FOR SELECT USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can manage their own answers" ON public.answers
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM public.questionnaire_assignments WHERE leader_id = auth.uid()
    )
  );

-- Feedback comments policies
DROP POLICY IF EXISTS "CEOs can manage feedback comments" ON public.feedback_comments;
DROP POLICY IF EXISTS "Leaders can view and reply to feedback on their submissions" ON public.feedback_comments;

CREATE POLICY "CEOs can manage feedback comments" ON public.feedback_comments
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view and reply to feedback on their submissions" ON public.feedback_comments
  FOR ALL USING (
    assignment_id IN (
      SELECT id FROM public.questionnaire_assignments WHERE leader_id = auth.uid()
    )
  );

-- Diary entries policies
DROP POLICY IF EXISTS "Users can manage their own diary entries" ON public.diary_entries;

CREATE POLICY "Users can manage their own diary entries" ON public.diary_entries
  FOR ALL USING (user_id = auth.uid());

-- Focus areas policies
DROP POLICY IF EXISTS "Users can manage their own focus areas" ON public.focus_areas;

CREATE POLICY "Users can manage their own focus areas" ON public.focus_areas
  FOR ALL USING (user_id = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Leaders table policies
DROP POLICY IF EXISTS "CEOs can manage leaders" ON public.leaders;
DROP POLICY IF EXISTS "Leaders can view their own record" ON public.leaders;

CREATE POLICY "CEOs can manage leaders" ON public.leaders
  FOR ALL USING (public.get_current_user_role() = 'ceo');

CREATE POLICY "Leaders can view their own record" ON public.leaders
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE email = leaders.email));

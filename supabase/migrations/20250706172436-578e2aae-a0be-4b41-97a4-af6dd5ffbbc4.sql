-- Add missing columns to diary_entries table
ALTER TABLE public.diary_entries 
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS collaborators jsonb DEFAULT '[]'::jsonb;

-- Add missing columns to focus_areas table  
ALTER TABLE public.focus_areas
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS collaborators jsonb DEFAULT '[]'::jsonb;

-- Update existing records to have empty arrays for new columns
UPDATE public.diary_entries 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

UPDATE public.diary_entries 
SET collaborators = '[]'::jsonb 
WHERE collaborators IS NULL;

UPDATE public.focus_areas 
SET tags = '[]'::jsonb 
WHERE tags IS NULL;

UPDATE public.focus_areas 
SET collaborators = '[]'::jsonb 
WHERE collaborators IS NULL;

-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates (if not exists)
DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON public.diary_entries;
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_focus_areas_updated_at ON public.focus_areas;
CREATE TRIGGER update_focus_areas_updated_at
  BEFORE UPDATE ON public.focus_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced RLS policies for focus_areas with collaborator access
DROP POLICY IF EXISTS "Users can view assigned focus areas" ON public.focus_areas;
CREATE POLICY "Users can view assigned focus areas" 
ON public.focus_areas 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  collaborators::jsonb @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
);

DROP POLICY IF EXISTS "Users can update assigned focus areas" ON public.focus_areas;
CREATE POLICY "Users can update assigned focus areas" 
ON public.focus_areas 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  (
    collaborators::jsonb @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text, 'permission', 'edit')) OR
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(collaborators) AS collab
      WHERE collab->>'user_id' = auth.uid()::text 
      AND collab->>'permission' = 'edit'
    )
  )
);
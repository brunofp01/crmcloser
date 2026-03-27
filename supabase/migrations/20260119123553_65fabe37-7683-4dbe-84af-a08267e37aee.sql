-- Drop the existing SELECT policy that allows all users to view all appointments
DROP POLICY IF EXISTS "Authenticated users can view all appointments" ON public.appointments;

-- Create a new SELECT policy that restricts visibility to the creator only
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (auth.uid() = created_by);
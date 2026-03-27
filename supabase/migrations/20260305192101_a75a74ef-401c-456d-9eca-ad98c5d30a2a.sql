
-- Profiles need to be visible to all authenticated users for name lookups
-- But editing is still restricted
DROP POLICY IF EXISTS "Users can view visible profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

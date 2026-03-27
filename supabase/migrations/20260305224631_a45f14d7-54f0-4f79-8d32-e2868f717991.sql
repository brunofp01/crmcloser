
-- Fix aprendizados_ia: restrict system INSERT to master only (edge functions use service_role which bypasses RLS)
DROP POLICY IF EXISTS "System can insert learnings" ON public.aprendizados_ia;

CREATE POLICY "Only master can insert learnings"
ON public.aprendizados_ia
FOR INSERT
TO authenticated
WITH CHECK (is_master_user(auth.uid()));

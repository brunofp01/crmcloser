
-- 1. Fix ai_conversations: replace overly permissive "System can manage conversations" 
-- Edge functions use service_role which bypasses RLS, so this is safe
DROP POLICY IF EXISTS "System can manage conversations" ON public.ai_conversations;

CREATE POLICY "Only master can manage conversations"
ON public.ai_conversations
FOR ALL
TO authenticated
USING (is_master_user(auth.uid()))
WITH CHECK (is_master_user(auth.uid()));

-- 2. Fix sync_logs: restrict INSERT and UPDATE to authenticated/master
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "System can update sync logs" ON public.sync_logs;

CREATE POLICY "Only master can insert sync logs"
ON public.sync_logs
FOR INSERT
TO authenticated
WITH CHECK (is_master_user(auth.uid()));

CREATE POLICY "Only master can update sync logs"
ON public.sync_logs
FOR UPDATE
TO authenticated
USING (is_master_user(auth.uid()));

-- 3. Fix notifications: restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix dismissed_matches: restrict SELECT to users who can see the related client
DROP POLICY IF EXISTS "Users can view dismissed matches" ON public.dismissed_matches;

CREATE POLICY "Users can view visible dismissed matches"
ON public.dismissed_matches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = dismissed_matches.client_id 
    AND (can_see_user(auth.uid(), c.created_by) OR can_see_user(auth.uid(), c.assigned_to))
  )
);

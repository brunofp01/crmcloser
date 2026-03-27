
-- Fix 1: Restrict notification INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: ai_conversations SELECT from public to authenticated
DROP POLICY IF EXISTS "Master can view all conversations" ON public.ai_conversations;
CREATE POLICY "Master can view all conversations" ON public.ai_conversations
  FOR SELECT TO authenticated
  USING (is_master_user(auth.uid()));


-- Fix 1: Scope profiles SELECT policy to visibility hierarchy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (can_see_user(auth.uid(), user_id));

-- Fix 2: Change public-role write policies to authenticated

-- profiles
DROP POLICY IF EXISTS "Only master can delete profiles" ON public.profiles;
CREATE POLICY "Only master can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile or master can update any" ON public.profiles;
CREATE POLICY "Users can update their own profile or master can update any" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR is_master_user(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Only master can delete roles" ON public.user_roles;
CREATE POLICY "Only master can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Only master can insert roles" ON public.user_roles;
CREATE POLICY "Only master can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Only master can update roles" ON public.user_roles;
CREATE POLICY "Only master can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (is_master_user(auth.uid()));

-- deals INSERT
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;
CREATE POLICY "Users can create deals" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- deals DELETE
DROP POLICY IF EXISTS "Master can delete deals" ON public.deals;
CREATE POLICY "Master can delete deals" ON public.deals
  FOR DELETE TO authenticated
  USING (is_master_user(auth.uid()));

-- push_subscriptions
DROP POLICY IF EXISTS "Users can delete their own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscription" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push subscription" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscription" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own push subscription" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscription" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- aprendizados_ia
DROP POLICY IF EXISTS "Master can manage learnings" ON public.aprendizados_ia;
CREATE POLICY "Master can manage learnings" ON public.aprendizados_ia
  FOR ALL TO authenticated
  USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Users can view approved learnings" ON public.aprendizados_ia;
CREATE POLICY "Users can view approved learnings" ON public.aprendizados_ia
  FOR SELECT TO authenticated
  USING ((status = 'aprovado') OR is_master_user(auth.uid()));

-- sync_logs (already authenticated, but ensure consistency)
-- dismissed_matches DELETE
DROP POLICY IF EXISTS "Users can delete their dismissed matches" ON public.dismissed_matches;
CREATE POLICY "Users can delete their dismissed matches" ON public.dismissed_matches
  FOR DELETE TO authenticated
  USING ((auth.uid() = dismissed_by) OR is_master_user(auth.uid()));

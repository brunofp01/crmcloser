
-- =====================================================
-- UPDATE RLS POLICIES FOR ROLE HIERARCHY
-- master: sees all | gerente: sees own + team | corretor: sees own
-- =====================================================

-- CLIENTS table
DROP POLICY IF EXISTS "Users can view their own or assigned clients, master sees all" ON public.clients;
CREATE POLICY "Users can view visible clients"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.can_see_user(auth.uid(), created_by)
    OR public.can_see_user(auth.uid(), assigned_to)
  );

DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
CREATE POLICY "Users can update visible clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    public.can_see_user(auth.uid(), created_by)
    OR public.can_see_user(auth.uid(), assigned_to)
  );

DROP POLICY IF EXISTS "Only master can delete clients" ON public.clients;
CREATE POLICY "Master can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (public.is_master_user(auth.uid()));

-- DEALS table
DROP POLICY IF EXISTS "Users can view deals" ON public.deals;
CREATE POLICY "Users can view visible deals"
  ON public.deals FOR SELECT TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));

DROP POLICY IF EXISTS "Users can update deals" ON public.deals;
CREATE POLICY "Users can update visible deals"
  ON public.deals FOR UPDATE TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));

-- DEAL_CLIENTS table
DROP POLICY IF EXISTS "Users can manage deal clients" ON public.deal_clients;
DROP POLICY IF EXISTS "Users can view deal clients" ON public.deal_clients;
CREATE POLICY "Users can view deal clients"
  ON public.deal_clients FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_clients.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));
CREATE POLICY "Users can manage deal clients"
  ON public.deal_clients FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_clients.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));

-- DEAL_INTERACTIONS table
DROP POLICY IF EXISTS "Users can view deal interactions" ON public.deal_interactions;
DROP POLICY IF EXISTS "Users can create deal interactions" ON public.deal_interactions;
CREATE POLICY "Users can view deal interactions"
  ON public.deal_interactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_interactions.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));
CREATE POLICY "Users can create deal interactions"
  ON public.deal_interactions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_interactions.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));

-- DEAL_PROPOSALS table
DROP POLICY IF EXISTS "Users can manage deal proposals" ON public.deal_proposals;
DROP POLICY IF EXISTS "Users can view deal proposals" ON public.deal_proposals;
CREATE POLICY "Users can view deal proposals"
  ON public.deal_proposals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_proposals.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));
CREATE POLICY "Users can manage deal proposals"
  ON public.deal_proposals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_proposals.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));

-- DEAL_PARTNERS table
DROP POLICY IF EXISTS "Users can manage deal partners" ON public.deal_partners;
DROP POLICY IF EXISTS "Users can view deal partners" ON public.deal_partners;
CREATE POLICY "Users can view deal partners"
  ON public.deal_partners FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_partners.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));
CREATE POLICY "Users can manage deal partners"
  ON public.deal_partners FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = deal_partners.deal_id
    AND public.can_see_user(auth.uid(), d.created_by)
  ));

-- CLIENT_INTERACTIONS table
DROP POLICY IF EXISTS "Users can view interactions for their clients" ON public.client_interactions;
CREATE POLICY "Users can view client interactions"
  ON public.client_interactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_interactions.client_id
    AND (public.can_see_user(auth.uid(), c.created_by) OR public.can_see_user(auth.uid(), c.assigned_to))
  ));

-- TASKS table
DROP POLICY IF EXISTS "Users can view own tasks or master all" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can view visible tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));
CREATE POLICY "Users can update visible tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));
CREATE POLICY "Users can delete visible tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));

-- APPOINTMENTS table
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete their appointments" ON public.appointments;
CREATE POLICY "Users can view visible appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));
CREATE POLICY "Users can update visible appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));
CREATE POLICY "Users can delete visible appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (public.can_see_user(auth.uid(), created_by));

-- NOTIFICATIONS table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- USER_ROLES - allow gerentes to view their team's roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view visible roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.can_see_user(auth.uid(), user_id));

-- PROFILES - allow visibility based on role hierarchy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view visible profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_see_user(auth.uid(), user_id));


CREATE TABLE public.dismissed_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  reason TEXT,
  dismissed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, deal_id)
);

ALTER TABLE public.dismissed_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dismissed matches" ON public.dismissed_matches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert dismissed matches" ON public.dismissed_matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = dismissed_by);

CREATE POLICY "Users can delete their dismissed matches" ON public.dismissed_matches
  FOR DELETE TO authenticated
  USING (auth.uid() = dismissed_by OR is_master_user(auth.uid()));

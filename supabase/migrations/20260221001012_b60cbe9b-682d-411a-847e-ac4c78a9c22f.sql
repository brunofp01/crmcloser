
-- =============================================
-- DEALS (Negócios) - Main deals table
-- =============================================
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Property info
  listing_url TEXT,
  title TEXT,
  listing_image_url TEXT,
  listing_description TEXT,
  valor NUMERIC,
  metragem NUMERIC,
  tipo TEXT, -- apartamento, cobertura, casa, etc.
  quartos INTEGER,
  suites INTEGER,
  salas INTEGER,
  cozinhas INTEGER,
  banheiros INTEGER,
  vagas INTEGER,
  elevador_social BOOLEAN DEFAULT false,
  elevador_servico BOOLEAN DEFAULT false,
  area_lazer JSONB DEFAULT '[]'::jsonb, -- piscina, academia, salão de festas, etc.
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  -- Commission
  comissao_percentual NUMERIC DEFAULT 0,
  tem_parceria BOOLEAN DEFAULT false,
  -- Owner
  proprietario_nome TEXT,
  proprietario_whatsapp TEXT,
  proprietario_email TEXT,
  -- Meta
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, cancelled
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals" ON public.deals FOR SELECT
  USING (is_master_user(auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Users can create deals" ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update deals" ON public.deals FOR UPDATE
  USING (is_master_user(auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Master can delete deals" ON public.deals FOR DELETE
  USING (is_master_user(auth.uid()));

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DEAL PARTNERS (Parceiros de comissão)
-- =============================================
CREATE TABLE public.deal_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal partners" ON public.deal_partners FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_partners.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE POLICY "Users can manage deal partners" ON public.deal_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_partners.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

-- =============================================
-- DEAL CLIENTS (Clientes vinculados ao negócio)
-- =============================================
CREATE TYPE public.deal_client_stage AS ENUM (
  'enviado', 'agendar_visita', 'visitou', 'em_negociacao', 'vendido',
  'nao_interessa', 'preco_alto', 'fora_do_perfil'
);

CREATE TABLE public.deal_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stage deal_client_stage NOT NULL DEFAULT 'enviado',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deal_id, client_id)
);

ALTER TABLE public.deal_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal clients" ON public.deal_clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_clients.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE POLICY "Users can manage deal clients" ON public.deal_clients FOR ALL
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_clients.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE TRIGGER update_deal_clients_updated_at BEFORE UPDATE ON public.deal_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DEAL PROPOSALS (Propostas)
-- =============================================
CREATE TABLE public.deal_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  valor_proposta NUMERIC NOT NULL,
  composicao JSONB DEFAULT '[]'::jsonb, -- [{tipo: 'a_vista', valor: 100000}, {tipo: 'financiamento', valor: 200000}, {tipo: 'permuta', valor: 50000, detalhes: '...'}]
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, counter
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal proposals" ON public.deal_proposals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_proposals.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE POLICY "Users can manage deal proposals" ON public.deal_proposals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_proposals.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE TRIGGER update_deal_proposals_updated_at BEFORE UPDATE ON public.deal_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DEAL INTERACTIONS (Histórico do negócio)
-- =============================================
CREATE TABLE public.deal_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- client_linked, stage_change, proposal_added, proposal_updated, note
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal interactions" ON public.deal_interactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_interactions.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

CREATE POLICY "Users can create deal interactions" ON public.deal_interactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_interactions.deal_id AND (is_master_user(auth.uid()) OR d.created_by = auth.uid())));

-- =============================================
-- Update clients table for new fields
-- =============================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS budget_min NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS urgencia TEXT; -- imediata, 3_meses, 6_meses, 1_ano, indefinida
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS finalidade TEXT; -- habitacao, investimento
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS forma_pagamento TEXT[]; -- a_vista, financiamento, permuta
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS elevator_preference TEXT DEFAULT 'indiferente'; -- sim, nao, indiferente
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cidades TEXT[];

-- Enable realtime for deals and deal_clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deal_clients;

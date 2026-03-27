
-- Add type column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'other';

-- Create lancamentos (developments) table
CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  construtora text,
  descricao text,
  status text NOT NULL DEFAULT 'active',
  tipo text,
  bairro text,
  cidade text,
  estado text,
  endereco text,
  numero text,
  cep text,
  latitude numeric,
  longitude numeric,
  previsao_entrega text,
  valor_min numeric,
  valor_max numeric,
  area_min numeric,
  area_max numeric,
  quartos_min integer,
  quartos_max integer,
  suites_min integer,
  suites_max integer,
  vagas_min integer,
  vagas_max integer,
  andares integer,
  unidades_por_andar integer,
  total_unidades integer,
  area_lazer jsonb DEFAULT '[]'::jsonb,
  diferenciais jsonb DEFAULT '[]'::jsonb,
  plantas jsonb DEFAULT '[]'::jsonb,
  fotos jsonb DEFAULT '[]'::jsonb,
  logo_url text,
  website_url text,
  video_url text,
  comissao_percentual numeric DEFAULT 0,
  forma_pagamento text[],
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lancamentos" ON public.lancamentos
  FOR SELECT TO authenticated USING (can_see_user(auth.uid(), created_by));

CREATE POLICY "Users can create lancamentos" ON public.lancamentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update visible lancamentos" ON public.lancamentos
  FOR UPDATE TO authenticated USING (can_see_user(auth.uid(), created_by));

CREATE POLICY "Master can delete lancamentos" ON public.lancamentos
  FOR DELETE TO authenticated USING (is_master_user(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

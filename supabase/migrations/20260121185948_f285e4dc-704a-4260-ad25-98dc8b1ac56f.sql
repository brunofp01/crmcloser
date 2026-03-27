-- Create imoveis (properties) table for property feed sync
CREATE TABLE public.imoveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL,
  titulo TEXT,
  descricao TEXT,
  tipo TEXT,
  categoria TEXT,
  valor NUMERIC,
  quartos INTEGER,
  suites INTEGER,
  banheiros INTEGER,
  vagas INTEGER,
  area_util NUMERIC,
  area_total NUMERIC,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  cep TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  fotos JSONB DEFAULT '[]'::jsonb,
  caracteristicas JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  xml_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on imoveis
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

-- Anyone can view active properties
CREATE POLICY "Anyone can view active properties" 
ON public.imoveis 
FOR SELECT 
USING (ativo = true);

-- Authenticated users can view all properties
CREATE POLICY "Authenticated users can view all properties" 
ON public.imoveis 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only system can manage properties (via edge functions with service role)
CREATE POLICY "System can manage properties" 
ON public.imoveis 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_master_user(auth.uid()));

-- Create indexes for common queries
CREATE INDEX idx_imoveis_codigo ON public.imoveis(codigo);
CREATE INDEX idx_imoveis_slug ON public.imoveis(slug);
CREATE INDEX idx_imoveis_tipo ON public.imoveis(tipo);
CREATE INDEX idx_imoveis_bairro ON public.imoveis(bairro);
CREATE INDEX idx_imoveis_cidade ON public.imoveis(cidade);
CREATE INDEX idx_imoveis_valor ON public.imoveis(valor);
CREATE INDEX idx_imoveis_quartos ON public.imoveis(quartos);

-- Create aprendizados_ia (AI learnings) table
CREATE TABLE public.aprendizados_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('pergunta_frequente', 'objecao', 'feedback', 'interesse', 'correcao')),
  pergunta TEXT,
  resposta TEXT,
  contexto JSONB,
  frequencia INTEGER DEFAULT 1,
  ultima_ocorrencia TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  aprovado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aprendizados_ia ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view approved learnings
CREATE POLICY "Users can view approved learnings" 
ON public.aprendizados_ia 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (status = 'aprovado' OR is_master_user(auth.uid())));

-- System can insert learnings
CREATE POLICY "System can insert learnings" 
ON public.aprendizados_ia 
FOR INSERT 
WITH CHECK (true);

-- Master can manage learnings
CREATE POLICY "Master can manage learnings" 
ON public.aprendizados_ia 
FOR ALL 
USING (is_master_user(auth.uid()));

-- Create indexes
CREATE INDEX idx_aprendizados_tipo ON public.aprendizados_ia(tipo);
CREATE INDEX idx_aprendizados_status ON public.aprendizados_ia(status);
CREATE INDEX idx_aprendizados_frequencia ON public.aprendizados_ia(frequencia DESC);

-- Create ai_conversations table for chat history
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  phone TEXT,
  platform TEXT DEFAULT 'web',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  extracted_interests JSONB DEFAULT '{}'::jsonb,
  lead_qualified BOOLEAN DEFAULT false,
  qualification_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Master can view all conversations
CREATE POLICY "Master can view all conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (is_master_user(auth.uid()));

-- System can manage conversations
CREATE POLICY "System can manage conversations" 
ON public.ai_conversations 
FOR ALL 
USING (true);

-- Create indexes
CREATE INDEX idx_ai_conversations_session ON public.ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_phone ON public.ai_conversations(phone);
CREATE INDEX idx_ai_conversations_client ON public.ai_conversations(client_id);
CREATE INDEX idx_ai_conversations_status ON public.ai_conversations(status);

-- Add trigger for updated_at
CREATE TRIGGER update_imoveis_updated_at
BEFORE UPDATE ON public.imoveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aprendizados_updated_at
BEFORE UPDATE ON public.aprendizados_ia
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
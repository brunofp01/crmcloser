-- Criar tabela para histórico de sincronizações
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'feed_xml',
  status TEXT NOT NULL DEFAULT 'started', -- started, success, failed, partial
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Estatísticas
  total_items INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  deactivated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Detalhes
  error_message TEXT,
  error_details JSONB,
  feed_hash TEXT, -- Hash do feed para detectar mudanças
  xml_size INTEGER, -- Tamanho do XML em bytes
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas
CREATE INDEX idx_sync_logs_started_at ON public.sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);

-- RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Apenas master pode visualizar logs de sync
CREATE POLICY "Master can view sync logs"
ON public.sync_logs FOR SELECT
USING (is_master_user(auth.uid()));

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert sync logs"
ON public.sync_logs FOR INSERT
WITH CHECK (true);

-- Sistema pode atualizar logs
CREATE POLICY "System can update sync logs"
ON public.sync_logs FOR UPDATE
USING (true);

-- Habilitar realtime para sync_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_logs;
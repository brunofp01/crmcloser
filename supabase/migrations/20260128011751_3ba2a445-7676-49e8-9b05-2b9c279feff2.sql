-- Add source column to imoveis table to track where each property came from
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'privus';

-- Create index for faster source filtering
CREATE INDEX IF NOT EXISTS idx_imoveis_source ON public.imoveis(source);

-- Add hotsite_url column for custom share links
ALTER TABLE public.imoveis 
ADD COLUMN IF NOT EXISTS hotsite_url TEXT;

-- Create a table to track different property sources
CREATE TABLE IF NOT EXISTS public.property_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_url TEXT,
  hotsite_base_url TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_interval_hours INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_sources ENABLE ROW LEVEL SECURITY;

-- Only master can manage sources
CREATE POLICY "Master can manage property sources" 
ON public.property_sources 
FOR ALL 
USING (is_master_user(auth.uid()));

-- Authenticated users can view sources
CREATE POLICY "Authenticated users can view sources" 
ON public.property_sources 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert default sources
INSERT INTO public.property_sources (name, description, base_url, hotsite_base_url, sync_enabled)
VALUES 
  ('privus', 'Privus Imóveis - Feed XML', 'https://www.privusimoveis.com.br', 'https://www.privusimoveis.com.br/imovel/', true),
  ('blow', 'Blow Empreendimentos - Web Scraping', 'https://www.blow.com.br', 'https://main.draodhn69q581.amplifyapp.com/hotsite/', true)
ON CONFLICT (name) DO NOTHING;

-- Add updated_at trigger for property_sources
CREATE TRIGGER update_property_sources_updated_at
BEFORE UPDATE ON public.property_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
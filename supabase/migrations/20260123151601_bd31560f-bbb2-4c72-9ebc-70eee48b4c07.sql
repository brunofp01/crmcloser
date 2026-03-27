-- Add field to specify if client accepts entire region or only specific neighborhoods
ALTER TABLE public.clients 
ADD COLUMN region_flexible boolean NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.clients.region_flexible IS 'If true, client accepts properties in the entire region. If false, only specific neighborhoods mentioned.';
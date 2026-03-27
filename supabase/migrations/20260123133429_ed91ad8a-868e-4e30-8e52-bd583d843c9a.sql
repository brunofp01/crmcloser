-- Add detailed client preference fields
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS budget_max numeric,
ADD COLUMN IF NOT EXISTS bedrooms_min integer,
ADD COLUMN IF NOT EXISTS parking_min integer,
ADD COLUMN IF NOT EXISTS area_min numeric,
ADD COLUMN IF NOT EXISTS property_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS transaction_type text DEFAULT 'sale',
ADD COLUMN IF NOT EXISTS needs_leisure boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS leisure_features text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.clients.budget_max IS 'Maximum budget in BRL';
COMMENT ON COLUMN public.clients.bedrooms_min IS 'Minimum number of bedrooms';
COMMENT ON COLUMN public.clients.parking_min IS 'Minimum number of parking spots';
COMMENT ON COLUMN public.clients.area_min IS 'Minimum area in m²';
COMMENT ON COLUMN public.clients.property_types IS 'Array of property types: apartamento, cobertura, garden, casa, terreno, comercial, flat';
COMMENT ON COLUMN public.clients.transaction_type IS 'sale or rent';
COMMENT ON COLUMN public.clients.needs_leisure IS 'Whether building amenities are required';
COMMENT ON COLUMN public.clients.leisure_features IS 'Specific leisure features needed: piscina, academia, salao_festas, playground, quadra, churrasqueira';
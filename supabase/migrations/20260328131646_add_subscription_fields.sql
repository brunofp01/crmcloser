-- Add subscription fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kiwify_order_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kiwify_payload JSONB;

-- Create an index for quick lookups by order id
CREATE INDEX IF NOT EXISTS idx_profiles_kiwify_order_id ON public.profiles(kiwify_order_id);

-- Update RLS for profiles (optional, but good for admin)
-- The Master admin can already see everything via existing policies likely,
-- but we ensure the status is readable.

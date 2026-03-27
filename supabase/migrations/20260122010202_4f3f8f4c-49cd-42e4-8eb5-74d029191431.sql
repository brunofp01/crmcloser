-- Add ai_enabled column to track AI automation per conversation
ALTER TABLE public.ai_conversations 
ADD COLUMN ai_enabled boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.ai_conversations.ai_enabled IS 'Whether AI auto-reply is enabled for this specific conversation';
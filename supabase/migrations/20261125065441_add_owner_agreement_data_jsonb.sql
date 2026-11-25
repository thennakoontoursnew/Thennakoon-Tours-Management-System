ALTER TABLE public.owner_agreements 
ADD COLUMN IF NOT EXISTS agreement_data JSONB DEFAULT '{}'::jsonb;

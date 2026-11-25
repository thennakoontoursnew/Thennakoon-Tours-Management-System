-- Add sections_json column to document_templates
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS sections_json JSONB DEFAULT '[]'::jsonb;

-- Add rendered_sections_snapshot column to owner_agreements and rental_agreements
ALTER TABLE public.owner_agreements ADD COLUMN IF NOT EXISTS rendered_sections_snapshot JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS rendered_sections_snapshot JSONB DEFAULT '[]'::jsonb;

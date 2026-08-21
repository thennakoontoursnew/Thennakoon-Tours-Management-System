-- Migration: Add configurable default_special_notes and default_invoice_terms to company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_special_notes TEXT;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_invoice_terms TEXT;

-- Ensure terms_and_conditions and special_notes columns exist on invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS special_notes TEXT;

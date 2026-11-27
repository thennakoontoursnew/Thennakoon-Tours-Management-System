-- Migration: 20261127051338_agreement_extension_letters.sql
-- Purpose: Add staff designation/signature support, company seal, and agreement_extensions table

-- 1. Staff Designation & Signature columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 2. Company Seal on company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS company_seal_url TEXT;

-- 3. Extended flag on parent agreement tables
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS is_extended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.owner_agreements ADD COLUMN IF NOT EXISTS is_extended BOOLEAN NOT NULL DEFAULT false;

-- 4. Ensure public 'signatures' bucket exists with idempotent RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access to Signatures'
  ) THEN
    CREATE POLICY "Public Access to Signatures" ON storage.objects
      FOR SELECT USING (bucket_id = 'signatures');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload to Signatures'
  ) THEN
    CREATE POLICY "Authenticated Upload to Signatures" ON storage.objects
      FOR ALL USING (bucket_id = 'signatures' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. Extension Number Sequence & Generator RPC
CREATE SEQUENCE IF NOT EXISTS public.agreement_extension_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_extension_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.agreement_extension_seq') INTO next_num;
  RETURN 'EXT-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- 6. Agreement Extensions Table
CREATE TABLE IF NOT EXISTS public.agreement_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_number TEXT UNIQUE NOT NULL DEFAULT public.generate_next_extension_number(),
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('user', 'owner')),
  user_agreement_id UUID REFERENCES public.rental_agreements(id) ON DELETE CASCADE,
  owner_agreement_id UUID REFERENCES public.owner_agreements(id) ON DELETE CASCADE,
  vehicle_reg_no TEXT,
  recipient_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  extension_period_type TEXT NOT NULL CHECK (extension_period_type IN ('fixed_period', 'until_further_notice')),
  extension_duration_label TEXT,
  new_end_date DATE,
  renewal_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'LKR',
  original_agreement_ref TEXT,
  custom_notes TEXT,
  issued_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_by_name TEXT NOT NULL,
  issued_by_designation TEXT NOT NULL,
  issued_by_signature_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_extension_parent CHECK (
    (agreement_type = 'user' AND user_agreement_id IS NOT NULL) OR
    (agreement_type = 'owner' AND owner_agreement_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_agreement_extensions_user_id ON public.agreement_extensions(user_agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_extensions_owner_id ON public.agreement_extensions(owner_agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_extensions_type ON public.agreement_extensions(agreement_type);

ALTER TABLE public.agreement_extensions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_extensions' AND policyname = 'agreement_extensions_select') THEN
    CREATE POLICY "agreement_extensions_select" ON public.agreement_extensions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_extensions' AND policyname = 'agreement_extensions_insert') THEN
    CREATE POLICY "agreement_extensions_insert" ON public.agreement_extensions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_extensions' AND policyname = 'agreement_extensions_update') THEN
    CREATE POLICY "agreement_extensions_update" ON public.agreement_extensions FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_extensions' AND policyname = 'agreement_extensions_delete') THEN
    CREATE POLICY "agreement_extensions_delete" ON public.agreement_extensions FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

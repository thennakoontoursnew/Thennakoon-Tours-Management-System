-- Migration: 20260810050000_user_agreement_versions.sql
-- Description: Add version_number to rental_agreements and create rental_agreement_versions table for controlled amendment history

-- 1. Add version_number column to rental_agreements if not exists
ALTER TABLE public.rental_agreements
ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;

-- 2. Create rental_agreement_versions table
CREATE TABLE IF NOT EXISTS public.rental_agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.rental_agreements(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  template_version TEXT NOT NULL DEFAULT 'USER_AGREEMENT_V1',
  lessee_snapshot JSONB,
  vehicle_snapshot JSONB,
  rental_snapshot JSONB,
  agreement_variables_snapshot JSONB,
  company_snapshot JSONB,
  nominated_drivers_snapshot JSONB,
  witnesses_snapshot JSONB,
  lessor_representative_snapshot JSONB,
  pickup_delivery_snapshot JSONB,
  special_notes TEXT,
  inventory_remarks TEXT,
  amendment_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_version_per_agreement UNIQUE (agreement_id, version_number)
);

-- Index for fast lookup of version history
CREATE INDEX IF NOT EXISTS idx_rental_agreement_versions_agreement_id 
ON public.rental_agreement_versions (agreement_id, version_number DESC);

-- Enable RLS
ALTER TABLE public.rental_agreement_versions ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated read on rental_agreement_versions"
  ON public.rental_agreement_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on rental_agreement_versions"
  ON public.rental_agreement_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

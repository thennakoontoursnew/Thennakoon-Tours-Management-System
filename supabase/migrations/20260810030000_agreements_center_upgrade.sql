-- Migration: 20260810030000_agreements_center_upgrade.sql
-- Purpose: Upgrade Agreements Module with Centralized User Agreement & Owner Agreement Architecture
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- 1. Create Owner Agreements Table
CREATE TABLE IF NOT EXISTS public.owner_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_number TEXT UNIQUE NOT NULL, -- OAG-YYYY-XXXXXX
    vehicle_owner_id UUID NOT NULL REFERENCES public.vehicle_owners(id) ON DELETE CASCADE,
    agreement_start_date DATE NOT NULL,
    agreement_end_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'signed', 'active', 'completed', 'cancelled', 'expired')),
    settlement_rule TEXT NOT NULL DEFAULT 'percentage' CHECK (settlement_rule IN ('fixed_daily', 'percentage', 'fixed_monthly', 'per_booking', 'manual')),
    revenue_share_pct NUMERIC(5,2),
    flat_rate_per_day NUMERIC(12,2),
    fixed_monthly_amount NUMERIC(12,2),
    per_booking_amount NUMERIC(12,2),
    payment_cycle TEXT DEFAULT 'monthly',
    security_deposit NUMERIC(12,2) DEFAULT 0,
    advance_amount NUMERIC(12,2) DEFAULT 0,
    maintenance_responsibility TEXT DEFAULT 'owner',
    insurance_responsibility TEXT DEFAULT 'owner',
    repair_responsibility TEXT DEFAULT 'owner',
    accident_damage_responsibility TEXT DEFAULT 'shared',
    license_document_responsibility TEXT DEFAULT 'owner',
    termination_notice_days INT DEFAULT 30,
    terms_and_conditions TEXT,
    special_conditions TEXT,
    internal_notes TEXT,
    signed_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    company_signed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    company_signed_at TIMESTAMPTZ,
    owner_signed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_archived BOOLEAN NOT NULL DEFAULT false
);

-- 2. Create Owner Agreement Vehicles Junction Table
CREATE TABLE IF NOT EXISTS public.owner_agreement_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_agreement_id UUID NOT NULL REFERENCES public.owner_agreements(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agreed_rate NUMERIC(12,2),
    revenue_share_pct NUMERIC(5,2),
    flat_rate_per_day NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(owner_agreement_id, vehicle_id)
);

-- 3. Sequence Generator for Owner Agreement Numbering (OAG-YYYY-XXXXXX)
CREATE SEQUENCE IF NOT EXISTS public.owner_agreement_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_owner_agreement_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.owner_agreement_seq') INTO next_num;
  RETURN 'OAG-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.owner_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_agreement_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_agreements_policy" ON public.owner_agreements;
CREATE POLICY "owner_agreements_policy" ON public.owner_agreements FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "owner_agreement_vehicles_policy" ON public.owner_agreement_vehicles;
CREATE POLICY "owner_agreement_vehicles_policy" ON public.owner_agreement_vehicles FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_owner_agreements_owner_id ON public.owner_agreements (vehicle_owner_id, status);
CREATE INDEX IF NOT EXISTS idx_owner_agreements_dates ON public.owner_agreements (agreement_start_date, agreement_end_date);
CREATE INDEX IF NOT EXISTS idx_owner_agreement_vehicles_pair ON public.owner_agreement_vehicles (owner_agreement_id, vehicle_id);

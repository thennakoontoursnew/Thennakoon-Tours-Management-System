-- Migration: 20260807100000_vehicle_owners_fuel_tracking.sql
-- Purpose: Stage 11 — Vehicle Owners, Fuel Tracking, and Advanced Fleet Analytics
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- ============================================================
-- 1. Vehicle Owners Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_number TEXT UNIQUE NOT NULL, -- VO-0001 format
    full_name TEXT NOT NULL,
    company_name TEXT,
    owner_type TEXT NOT NULL DEFAULT 'individual' CHECK (owner_type IN ('individual', 'company', 'partnership')),
    national_id TEXT,
    mobile TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_branch TEXT,
    revenue_share_pct NUMERIC(5,2) DEFAULT 0 CHECK (revenue_share_pct >= 0 AND revenue_share_pct <= 100),
    flat_rate_per_day NUMERIC(12,2),
    payment_terms TEXT DEFAULT 'monthly' CHECK (payment_terms IN ('per_booking', 'weekly', 'monthly', 'quarterly')),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Link vehicle_owners to vehicles
-- ============================================================
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS vehicle_owner_id UUID REFERENCES public.vehicle_owners(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_revenue_share_pct NUMERIC(5,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_flat_rate_per_day NUMERIC(12,2);

-- ============================================================
-- 3. Owner Payout Records Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.owner_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_owner_id UUID NOT NULL REFERENCES public.vehicle_owners(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    payout_number TEXT UNIQUE NOT NULL, -- OP-0001 format
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
    owner_share_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) DEFAULT 0,
    net_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    payment_date DATE,
    payment_reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Fuel Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    fuel_type TEXT NOT NULL DEFAULT 'diesel' CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg')),
    liters NUMERIC(8,2) NOT NULL CHECK (liters > 0),
    cost_per_liter NUMERIC(8,2) NOT NULL CHECK (cost_per_liter > 0),
    total_cost NUMERIC(10,2) NOT NULL,
    odometer_reading NUMERIC(12,2),
    station_name TEXT,
    station_location TEXT,
    receipt_number TEXT,
    receipt_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Vehicle Fuel Efficiency Stats (denormalized for fast analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicle_fuel_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    period_month TEXT NOT NULL, -- 'YYYY-MM'
    total_liters NUMERIC(10,2) DEFAULT 0,
    total_fuel_cost NUMERIC(12,2) DEFAULT 0,
    km_driven NUMERIC(12,2) DEFAULT 0,
    efficiency_km_per_liter NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (vehicle_id, period_month)
);

-- ============================================================
-- 6. Auto-generate Owner Number Sequence
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.vehicle_owner_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_owner_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT nextval('public.vehicle_owner_number_seq') INTO next_num;
  RETURN 'VNO-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 7. Auto-generate Payout Number Sequence
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.owner_payout_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_payout_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT nextval('public.owner_payout_number_seq') INTO next_num;
  RETURN 'OPY-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 8. Enable RLS
-- ============================================================
ALTER TABLE public.vehicle_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_fuel_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_owners_policy" ON public.vehicle_owners;
CREATE POLICY "vehicle_owners_policy" ON public.vehicle_owners FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "owner_payouts_policy" ON public.owner_payouts;
CREATE POLICY "owner_payouts_policy" ON public.owner_payouts FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "fuel_logs_policy" ON public.fuel_logs;
CREATE POLICY "fuel_logs_policy" ON public.fuel_logs FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_fuel_stats_policy" ON public.vehicle_fuel_stats;
CREATE POLICY "vehicle_fuel_stats_policy" ON public.vehicle_fuel_stats FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 9. Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vehicle_owners_active ON public.vehicle_owners (is_active, full_name);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_owner ON public.owner_payouts (vehicle_owner_id, status, period_start);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle ON public.fuel_logs (vehicle_id, log_date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_booking ON public.fuel_logs (booking_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_driver ON public.fuel_logs (driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_stats_vehicle ON public.vehicle_fuel_stats (vehicle_id, period_month);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON public.vehicles (vehicle_owner_id);

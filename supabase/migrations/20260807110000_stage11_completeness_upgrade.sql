-- Migration: 20260807110000_stage11_completeness_upgrade.sql
-- Purpose: Stage 11 Completeness Upgrade — Settlement Rules, Owner Statements, Fuel Efficiency, Downtime Tracking, Expense Linkage & RLS

-- 1. Extend vehicle_owners with settlement_rule
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS settlement_rule TEXT DEFAULT 'percentage' CHECK (settlement_rule IN ('fixed_daily', 'percentage', 'fixed_monthly', 'per_booking', 'manual'));

-- 2. Extend owner_payouts with settlement details, statement links, and partial payouts
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS settlement_rule TEXT;
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS revenue_share_pct NUMERIC(5,2);
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS flat_rate_per_day NUMERIC(12,2);
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.owner_payouts ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- 3. Owner Statements Table
CREATE TABLE IF NOT EXISTS public.owner_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_number TEXT UNIQUE NOT NULL, -- STM-2026-000001
    vehicle_owner_id UUID NOT NULL REFERENCES public.vehicle_owners(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_balance NUMERIC(12,2) DEFAULT 0,
    earnings NUMERIC(12,2) DEFAULT 0,
    adjustments NUMERIC(12,2) DEFAULT 0,
    deductions NUMERIC(12,2) DEFAULT 0,
    payments NUMERIC(12,2) DEFAULT 0,
    closing_balance NUMERIC(12,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'settled', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Extend fuel_logs with full-to-full efficiency fields and expense linkage
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS is_full_tank BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS km_since_last_refuel NUMERIC(10,2);
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS km_per_liter NUMERIC(6,2);
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS liters_per_100km NUMERIC(6,2);
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- 5. Vehicle Status History Table for reliable fleet downtime analytics
CREATE TABLE IF NOT EXISTS public.vehicle_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT
);

-- 6. Sequence Generators with OWN-YYYY-XXXXXX and SET-YYYY-XXXXXX Formats
CREATE SEQUENCE IF NOT EXISTS public.vehicle_owner_number_seq_v2 START 1;
CREATE SEQUENCE IF NOT EXISTS public.owner_settlement_number_seq_v2 START 1;
CREATE SEQUENCE IF NOT EXISTS public.owner_statement_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_owner_number_v2()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.vehicle_owner_number_seq_v2') INTO next_num;
  RETURN 'OWN-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_settlement_number_v2()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.owner_settlement_number_seq_v2') INTO next_num;
  RETURN 'SET-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_statement_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.owner_statement_number_seq') INTO next_num;
  RETURN 'STM-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- 7. Enable RLS and Policies for new tables
ALTER TABLE public.owner_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_statements_policy" ON public.owner_statements;
CREATE POLICY "owner_statements_policy" ON public.owner_statements FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_status_history_policy" ON public.vehicle_status_history;
CREATE POLICY "vehicle_status_history_policy" ON public.vehicle_status_history FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_statements_owner ON public.owner_statements (vehicle_owner_id, statement_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_status_history_vid ON public.vehicle_status_history (vehicle_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_expense ON public.fuel_logs (expense_id);
CREATE INDEX IF NOT EXISTS idx_owner_payouts_expense ON public.owner_payouts (expense_id);

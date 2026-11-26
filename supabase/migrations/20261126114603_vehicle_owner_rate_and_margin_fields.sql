-- Migration: 20261126114603_vehicle_owner_rate_and_margin_fields.sql
-- Purpose: Extend vehicles and vehicle_owners for dual-pricing (Self-Drive vs With-Driver), owner payout rates, margin tracking, and inline owner fields

-- 1. Update ownership_type constraint on vehicles to support both legacy ('external_owner') and new ('owner_leased') values
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_ownership_type_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_ownership_type_check
  CHECK (ownership_type IN ('company', 'owner_leased', 'external_owner', 'leased', 'financed'));

-- 2. Extend vehicles table with Owner Cost vs. Company Selling Rate & Operational Terms
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_daily_rate_self NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_monthly_rate_self NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_daily_rate_with_driver NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_monthly_rate_with_driver NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS selling_daily_rate_with_driver NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS selling_monthly_rate_with_driver NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS driver_bata_per_day NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS monthly_km_quota INTEGER DEFAULT 3000;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_excess_km_rate NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS service_interval_km INTEGER DEFAULT 5000;

-- 3. Extend vehicle_owners table cleanly and allow Monthly / Per Trip / Weekly labels alongside snake_case
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS monthly_km_quota INTEGER DEFAULT 3000;
ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS owner_excess_km_rate NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.vehicle_owners DROP CONSTRAINT IF EXISTS vehicle_owners_payment_terms_check;
ALTER TABLE public.vehicle_owners ADD CONSTRAINT vehicle_owners_payment_terms_check
  CHECK (payment_terms IN ('per_booking', 'per_trip', 'weekly', 'monthly', 'quarterly', 'Monthly', 'Per Trip', 'Weekly', 'Quarterly'));

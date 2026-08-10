-- Migration: 20260810040000_user_agreement_v1_upgrade.sql
-- Description: Upgrade rental_agreements for complete User Agreement V1 snapshotting, legal versioning, variable fields, and company defaults.

ALTER TABLE public.rental_agreements
  ADD COLUMN IF NOT EXISTS template_version text DEFAULT 'USER_AGREEMENT_V1',
  ADD COLUMN IF NOT EXISTS lessee_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rental_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS agreement_variables_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS company_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nominated_drivers_snapshot jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS witnesses_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS lessor_representative_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pickup_delivery_snapshot jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS special_notes text,
  ADD COLUMN IF NOT EXISTS inventory_remarks text;

-- Add user agreement default settings to company_settings if not present
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_user_agreement_version text DEFAULT 'USER_AGREEMENT_V1',
  ADD COLUMN IF NOT EXISTS default_allowed_km_per_day numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS default_extra_km_rate numeric DEFAULT 75,
  ADD COLUMN IF NOT EXISTS default_minor_repair_limit numeric DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS default_insurance_excess numeric DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS default_cleaning_fee numeric DEFAULT 3500,
  ADD COLUMN IF NOT EXISTS default_full_interior_cleaning_fee numeric DEFAULT 7500,
  ADD COLUMN IF NOT EXISTS default_additional_driver_fee numeric DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS default_security_deposit_hold_days integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS default_notice_period_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_agreement_location text DEFAULT 'Nugegoda, Sri Lanka',
  ADD COLUMN IF NOT EXISTS default_company_hotline text DEFAULT '+94 112 823 723 / +94 760 080 155',
  ADD COLUMN IF NOT EXISTS default_agreement_bank_info text DEFAULT 'Nations Trust Bank - Nugegoda Branch, Account # 100530013140, Swift Code: NTBCLKLX, Thennakoon Tours (Pvt) Ltd';

-- Index for agreement template version & lookup
CREATE INDEX IF NOT EXISTS idx_rental_agreements_template_ver ON public.rental_agreements (template_version);

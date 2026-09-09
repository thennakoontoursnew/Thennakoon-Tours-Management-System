-- Migration: Unified Vehicle Onboarding Pipeline, Partner Negotiation & On-Call Fleet
-- Purpose: Add onboarding pipeline statuses and partner negotiation metadata to vehicles table.

-- 1. Drop existing vehicle status check constraint and re-add with all onboarding statuses
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS check_vehicle_status;
ALTER TABLE public.vehicles ADD CONSTRAINT check_vehicle_status
  CHECK (status IN (
    'pending_inspection',
    'inspection_failed',
    'pending_management_approval',
    'available',
    'available_on_call',
    'standby_pool',
    'reserved',
    'rented',
    'on_trip',
    'maintenance',
    'out_of_service',
    'rejected',
    'archived',
    'inactive'
  ));

-- 2. Add holding_type column
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS holding_type TEXT DEFAULT 'owner_held';
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS check_vehicle_holding_type;
ALTER TABLE public.vehicles ADD CONSTRAINT check_vehicle_holding_type
  CHECK (holding_type IN ('in_house', 'owner_held'));

-- 3. Add partner owner contact & rate negotiation columns
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_contact_name TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_contact_phone TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS agreed_payout_rate NUMERIC(12,2);

-- 4. Add deferred owner agreement status
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_agreement_status TEXT DEFAULT 'pending_dispatch';
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS check_vehicle_owner_agreement_status;
ALTER TABLE public.vehicles ADD CONSTRAINT check_vehicle_owner_agreement_status
  CHECK (owner_agreement_status IN ('pending_dispatch', 'signed', 'exempt', 'expired'));

-- 5. Add management review metadata
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS management_decision TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS management_notes TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS management_reviewed_at TIMESTAMPTZ;

-- 6. Add indices for fast filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_holding_type ON public.vehicles (holding_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_agreement_status ON public.vehicles (owner_agreement_status);

-- Migration: 20260807010000_booking_lifecycle_upgrade.sql
-- Purpose: Booking operational lifecycle tables, constraints, and audit functions

-- 1. Update check_booking_status constraint to support full operational lifecycle
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_status;

ALTER TABLE public.bookings ADD CONSTRAINT check_booking_status
CHECK (status IN (
  'pending',
  'confirmed',
  'ready',
  'in_progress',
  'on_trip',
  'returned',
  'completed',
  'closed',
  'cancelled',
  'no_show'
));

-- Add actual_pickup_at & actual_return_at to bookings if missing
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_pickup_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_return_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 2. Create Pre-Handover / Vehicle Ready Checklist Table
CREATE TABLE IF NOT EXISTS public.booking_handover_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    cleanliness_checked BOOLEAN NOT NULL DEFAULT true,
    documents_checked BOOLEAN NOT NULL DEFAULT true,
    insurance_valid BOOLEAN NOT NULL DEFAULT true,
    revenue_license_valid BOOLEAN NOT NULL DEFAULT true,
    emission_test_valid BOOLEAN NOT NULL DEFAULT true,
    tyres_checked BOOLEAN NOT NULL DEFAULT true,
    lights_checked BOOLEAN NOT NULL DEFAULT true,
    fuel_level_percent INTEGER NOT NULL DEFAULT 100 CHECK (fuel_level_percent BETWEEN 0 AND 100),
    odometer_reading NUMERIC(12,2) NOT NULL DEFAULT 0,
    existing_damage_notes TEXT,
    staff_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_handover_per_booking UNIQUE (booking_id)
);

-- 3. Create Vehicle Return Checklist & Inspection Table
CREATE TABLE IF NOT EXISTS public.booking_return_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    actual_return_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    pickup_odometer NUMERIC(12,2) NOT NULL DEFAULT 0,
    return_odometer NUMERIC(12,2) NOT NULL DEFAULT 0,
    actual_km_driven NUMERIC(12,2) NOT NULL DEFAULT 0,
    allowed_km NUMERIC(12,2) NOT NULL DEFAULT 0,
    extra_km NUMERIC(12,2) NOT NULL DEFAULT 0,
    extra_km_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    extra_km_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
    pickup_fuel_percent INTEGER NOT NULL DEFAULT 100,
    return_fuel_percent INTEGER NOT NULL DEFAULT 100,
    exterior_condition TEXT NOT NULL DEFAULT 'pass' CHECK (exterior_condition IN ('pass', 'attention_required', 'damage_found')),
    interior_condition TEXT NOT NULL DEFAULT 'pass' CHECK (interior_condition IN ('pass', 'attention_required', 'damage_found')),
    tyres_condition TEXT NOT NULL DEFAULT 'pass' CHECK (tyres_condition IN ('pass', 'attention_required', 'damage_found')),
    lights_condition TEXT NOT NULL DEFAULT 'pass' CHECK (lights_condition IN ('pass', 'attention_required', 'damage_found')),
    glass_condition TEXT NOT NULL DEFAULT 'pass' CHECK (glass_condition IN ('pass', 'attention_required', 'damage_found')),
    damage_found BOOLEAN NOT NULL DEFAULT false,
    damage_description TEXT,
    overall_status TEXT NOT NULL DEFAULT 'pass' CHECK (overall_status IN ('pass', 'attention_required', 'damage_found')),
    received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_return_per_booking UNIQUE (booking_id)
);

-- 4. Create Extra Booking Charges Table
CREATE TABLE IF NOT EXISTS public.booking_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    charge_type TEXT NOT NULL CHECK (charge_type IN ('extra_km', 'fuel_shortage', 'damage', 'late_return', 'cleaning', 'toll', 'parking', 'other')),
    description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'waived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create Structured Cancellation & No Show Table
CREATE TABLE IF NOT EXISTS public.booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('cancellation', 'no_show')),
    reason TEXT NOT NULL,
    notes TEXT,
    refund_required BOOLEAN NOT NULL DEFAULT false,
    refund_status TEXT NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processed', 'waived')),
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_cancellation_per_booking UNIQUE (booking_id)
);

-- Enable RLS and Policies for new tables
ALTER TABLE public.booking_handover_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_return_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_cancellations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_handover_checks_policy" ON public.booking_handover_checks;
CREATE POLICY "booking_handover_checks_policy" ON public.booking_handover_checks FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "booking_return_checks_policy" ON public.booking_return_checks;
CREATE POLICY "booking_return_checks_policy" ON public.booking_return_checks FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "booking_charges_policy" ON public.booking_charges;
CREATE POLICY "booking_charges_policy" ON public.booking_charges FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "booking_cancellations_policy" ON public.booking_cancellations;
CREATE POLICY "booking_cancellations_policy" ON public.booking_cancellations FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_handover_bid ON public.booking_handover_checks (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_return_bid ON public.booking_return_checks (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_charges_bid ON public.booking_charges (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_cancellations_bid ON public.booking_cancellations (booking_id);

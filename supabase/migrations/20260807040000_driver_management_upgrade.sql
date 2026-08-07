-- Migration: 20260807040000_driver_management_upgrade.sql
-- Purpose: Driver Operations & Availability Management schema tables, constraints, and indexes

-- 1. Update check_driver_status constraint on public.drivers
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS check_driver_status;

ALTER TABLE public.drivers
ADD CONSTRAINT check_driver_status
CHECK (status IN ('available', 'assigned', 'on_trip', 'on_leave', 'unavailable', 'inactive'));

-- 2. Driver Unavailability & Operational Leave Table
CREATE TABLE IF NOT EXISTS public.driver_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    unavailability_type TEXT NOT NULL DEFAULT 'annual_leave' CHECK (unavailability_type IN ('annual_leave', 'medical_leave', 'personal', 'training', 'suspended', 'other')),
    reason TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Driver Operational Incidents & Violations Table
CREATE TABLE IF NOT EXISTS public.driver_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    incident_type TEXT NOT NULL CHECK (incident_type IN ('traffic_violation', 'customer_complaint', 'vehicle_damage', 'late_arrival', 'documentation_issue', 'safety_issue', 'other')),
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('low', 'minor', 'moderate', 'severe')),
    description TEXT NOT NULL,
    action_taken TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Driver Internal Staff Notes Table
CREATE TABLE IF NOT EXISTS public.driver_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'availability', 'performance', 'incident', 'document', 'other')),
    is_important BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS & Policies
ALTER TABLE public.driver_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_unavailability_policy" ON public.driver_unavailability;
CREATE POLICY "driver_unavailability_policy" ON public.driver_unavailability FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "driver_incidents_policy" ON public.driver_incidents;
CREATE POLICY "driver_incidents_policy" ON public.driver_incidents FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "driver_notes_policy" ON public.driver_notes;
CREATE POLICY "driver_notes_policy" ON public.driver_notes FOR ALL USING (auth.uid() IS NOT NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry ON public.driver_documents (driver_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_unavailability_dates ON public.driver_unavailability (driver_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_driver_incidents_date ON public.driver_incidents (driver_id, incident_date);
CREATE INDEX IF NOT EXISTS idx_driver_notes_did ON public.driver_notes (driver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_booking_vehicles_driver_id ON public.booking_vehicles (driver_id);

-- Migration: 20260807020000_fleet_management_upgrade.sql
-- Purpose: Vehicle & Fleet Management Upgrade schema tables, constraints, and indexes

-- 1. Update check_vehicle_status constraint
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS check_vehicle_status;

ALTER TABLE public.vehicles ADD CONSTRAINT check_vehicle_status
CHECK (status IN (
  'available',
  'reserved',
  'rented',
  'on_trip',
  'maintenance',
  'inspection_required',
  'inactive'
));

-- 2. Add extra fleet management columns to vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS ownership_type TEXT DEFAULT 'company' CHECK (ownership_type IN ('company', 'external_owner', 'leased', 'financed'));
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS qr_code_identifier TEXT;

-- 3. Vehicle Odometer Logs Table
CREATE TABLE IF NOT EXISTS public.vehicle_odometer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    odometer NUMERIC(12,2) NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'handover', 'return', 'maintenance', 'inspection')),
    source_id UUID,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Vehicle Documents Table
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('registration', 'insurance', 'revenue_license', 'emission_test', 'fitness_certificate', 'lease_finance', 'other')),
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    provider TEXT,
    notes TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'valid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Vehicle Photos Table
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'primary' CHECK (category IN ('primary', 'front', 'rear', 'left', 'right', 'interior', 'dashboard', 'damage', 'other')),
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS & Policies
ALTER TABLE public.vehicle_odometer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_odometer_logs_policy" ON public.vehicle_odometer_logs;
CREATE POLICY "vehicle_odometer_logs_policy" ON public.vehicle_odometer_logs FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_documents_policy" ON public.vehicle_documents;
CREATE POLICY "vehicle_documents_policy" ON public.vehicle_documents FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_photos_policy" ON public.vehicle_photos;
CREATE POLICY "vehicle_photos_policy" ON public.vehicle_photos FOR ALL USING (auth.uid() IS NOT NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_expiry ON public.vehicle_documents (vehicle_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_odometer_logs_time ON public.vehicle_odometer_logs (vehicle_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vid ON public.vehicle_photos (vehicle_id);

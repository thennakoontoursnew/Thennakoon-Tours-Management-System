-- Migration: 20260807060000_inspection_maintenance_upgrade.sql
-- Purpose: Stage 7 Inspection & Maintenance Management Upgrade (Fresh-Database Safe)

-- 1. Service Providers / Garages Table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    contact_person TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    service_types TEXT[] DEFAULT '{}'::text[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vehicle Inspections Table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_number TEXT NOT NULL UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_handover', 'return', 'general', 'maintenance', 'damage')),
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    odometer_reading INTEGER,
    fuel_level_percent INTEGER,
    overall_condition TEXT NOT NULL DEFAULT 'pass' CHECK (overall_condition IN ('pass', 'attention_required', 'damage_found', 'maintenance_required')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
    checklist_data JSONB DEFAULT '{}'::jsonb,
    general_notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Vehicle Damage Records Table
CREATE TABLE IF NOT EXISTS public.vehicle_damage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    damage_number TEXT NOT NULL UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES public.vehicle_inspections(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    damage_type TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
    description TEXT NOT NULL,
    estimated_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    responsibility TEXT NOT NULL DEFAULT 'customer' CHECK (responsibility IN ('customer', 'company', 'driver', 'third_party', 'unknown')),
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'assessing', 'repair_scheduled', 'under_repair', 'resolved', 'waived')),
    photo_urls JSONB DEFAULT '[]'::jsonb,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Maintenance Tasks Table
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number TEXT NOT NULL UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES public.vehicle_inspections(id) ON DELETE SET NULL,
    damage_id UUID REFERENCES public.vehicle_damage_records(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('routine_service', 'oil_change', 'filter_change', 'tyres', 'brake_service', 'battery', 'air_conditioning', 'electrical', 'engine_repair', 'body_repair', 'accident_repair', 'cleaning_detailing', 'inspection_followup', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'due', 'overdue', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    scheduled_mileage INTEGER,
    start_date DATE,
    completion_date DATE,
    completed_mileage INTEGER,
    service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    provider_name TEXT,
    labour_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    parts_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    other_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    invoice_reference TEXT,
    notes TEXT,
    next_service_date DATE,
    next_service_mileage INTEGER,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Maintenance Task Line Items Table
CREATE TABLE IF NOT EXISTS public.maintenance_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_damage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_task_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_providers_policy" ON public.service_providers;
CREATE POLICY "service_providers_policy" ON public.service_providers FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_inspections_policy" ON public.vehicle_inspections;
CREATE POLICY "vehicle_inspections_policy" ON public.vehicle_inspections FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_damage_records_policy" ON public.vehicle_damage_records;
CREATE POLICY "vehicle_damage_records_policy" ON public.vehicle_damage_records FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "maintenance_tasks_policy" ON public.maintenance_tasks;
CREATE POLICY "maintenance_tasks_policy" ON public.maintenance_tasks FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "maintenance_task_items_policy" ON public.maintenance_task_items;
CREATE POLICY "maintenance_task_items_policy" ON public.maintenance_task_items FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON public.vehicle_inspections (vehicle_id, inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_booking ON public.vehicle_inspections (booking_id);
CREATE INDEX IF NOT EXISTS idx_damage_vehicle ON public.vehicle_damage_records (vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON public.maintenance_tasks (vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON public.maintenance_tasks (scheduled_date, status);

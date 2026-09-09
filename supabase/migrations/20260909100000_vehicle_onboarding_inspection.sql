-- Migration: Vehicle Onboarding Inspection Workflow
-- Ensures vehicles table status constraint and vehicle_inspections table constraints allow onboarding statuses and types.

-- 1. Update vehicles status check constraint
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS check_vehicle_status;
ALTER TABLE public.vehicles ADD CONSTRAINT check_vehicle_status 
  CHECK (status IN ('available', 'reserved', 'rented', 'on_trip', 'maintenance', 'out_of_service', 'archived', 'pending_inspection', 'inspection_failed', 'inactive'));

-- 2. Update vehicle_inspections inspection_type check constraint
ALTER TABLE public.vehicle_inspections DROP CONSTRAINT IF EXISTS vehicle_inspections_inspection_type_check;
ALTER TABLE public.vehicle_inspections ADD CONSTRAINT vehicle_inspections_inspection_type_check 
  CHECK (inspection_type IN ('pre_handover', 'return', 'general', 'maintenance', 'damage', 'pre_onboarding', 'onboarding'));

-- 3. Update vehicle_inspections overall_condition check constraint
ALTER TABLE public.vehicle_inspections DROP CONSTRAINT IF EXISTS vehicle_inspections_overall_condition_check;
ALTER TABLE public.vehicle_inspections ADD CONSTRAINT vehicle_inspections_overall_condition_check 
  CHECK (overall_condition IN ('pass', 'fail', 'conditional', 'attention_required', 'damage_found', 'maintenance_required'));

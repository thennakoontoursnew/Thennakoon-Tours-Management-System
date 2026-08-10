-- Migration: 20260810020000_system_admin_production_hardening.sql
-- Purpose: Stage 15 — System Administration & Production Hardening
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- 1. Role Permissions Matrix Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'operations_staff', 'finance_staff', 'driver', 'customer', 'vehicle_owner')),
    module TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role, module)
);

-- 2. System Configuration & Document Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Default Role Permissions Matrix if empty
INSERT INTO public.role_permissions (role, module, can_view, can_create, can_edit, can_delete)
VALUES
    ('owner', 'finance', true, true, true, true),
    ('admin', 'finance', true, true, true, true),
    ('manager', 'finance', true, true, true, false),
    ('finance_staff', 'finance', true, true, true, false),
    ('operations_staff', 'finance', false, false, false, false),
    ('owner', 'fleet', true, true, true, true),
    ('admin', 'fleet', true, true, true, true),
    ('manager', 'fleet', true, true, true, false),
    ('operations_staff', 'fleet', true, true, true, false)
ON CONFLICT (role, module) DO NOTHING;

-- Seed Default System Settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES
    ('company_profile', '{"company_name": "Thennakoon Tours & Rent a Car", "tax_number": "VAT-11928374", "phone": "+94 77 123 4567", "email": "info@thennakoontours.lk", "currency": "LKR"}'::jsonb),
    ('document_defaults', '{"quotation_prefix": "QT", "booking_prefix": "BK", "agreement_prefix": "RA", "invoice_prefix": "INV", "receipt_prefix": "REC", "expense_prefix": "EXP"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 3. Enable RLS and Policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_policy" ON public.role_permissions FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "system_settings_policy" ON public.system_settings;
CREATE POLICY "system_settings_policy" ON public.system_settings FOR ALL USING (auth.uid() IS NOT NULL);

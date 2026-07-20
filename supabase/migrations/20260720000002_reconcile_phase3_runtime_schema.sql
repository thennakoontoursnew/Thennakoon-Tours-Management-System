-- Migration: 20260720000002_reconcile_phase3_runtime_schema.sql
-- Description: Comprehensive schema reconciliation for customers, quotations, document_templates, vehicles, and company_settings.

-- 1. Ensure public.set_current_timestamp_updated_at function exists
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Customer Schema Reconciliation (address & address_line_1 compatibility)
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS address TEXT;

UPDATE public.customers
SET address = address_line_1
WHERE address IS NULL AND address_line_1 IS NOT NULL;

UPDATE public.customers
SET address_line_1 = address
WHERE address_line_1 IS NULL AND address IS NOT NULL;

-- 3. Quotation Schema Reconciliation (Explicit Snapshot Columns & Legacy Compatibility)
ALTER TABLE IF EXISTS public.quotations
    ADD COLUMN IF NOT EXISTS special_notes TEXT,
    ADD COLUMN IF NOT EXISTS important_message TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS bank_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS bank_branch_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS bank_swift_code_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS payment_instructions_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS prepared_by_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS prepared_by_designation_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS company_name_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS terms_and_conditions_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS bank_details_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS prepared_by_label_snapshot TEXT;

-- 4. Document Templates Schema Reconciliation
ALTER TABLE IF EXISTS public.document_templates
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS special_notes TEXT,
    ADD COLUMN IF NOT EXISTS important_message TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_branch TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_swift_code TEXT,
    ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
    ADD COLUMN IF NOT EXISTS prepared_by_designation TEXT,
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS default_terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS bank_details JSONB,
    ADD COLUMN IF NOT EXISTS prepared_by_label TEXT,
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE IF EXISTS public.document_templates ALTER COLUMN title DROP NOT NULL;

UPDATE public.document_templates
SET display_name = COALESCE(display_name, title)
WHERE display_name IS NULL AND title IS NOT NULL;

UPDATE public.document_templates
SET title = COALESCE(title, display_name, initcap(replace(document_type, '_', ' ')) || ' Template')
WHERE title IS NULL;

UPDATE public.document_templates
SET default_terms_and_conditions = COALESCE(default_terms_and_conditions, terms_and_conditions)
WHERE default_terms_and_conditions IS NULL AND terms_and_conditions IS NOT NULL;

UPDATE public.document_templates
SET terms_and_conditions = COALESCE(terms_and_conditions, default_terms_and_conditions)
WHERE terms_and_conditions IS NULL AND default_terms_and_conditions IS NOT NULL;

-- 5. Vehicles Schema Verification
ALTER TABLE IF EXISTS public.vehicles
    ADD COLUMN IF NOT EXISTS daily_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS refundable_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowed_km_per_day NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS extra_km_charge NUMERIC(10,2);

-- 6. Guarded Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customers_created_by_fkey'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quotations_prepared_by_fkey'
    ) THEN
        ALTER TABLE public.quotations
        ADD CONSTRAINT quotations_prepared_by_fkey
        FOREIGN KEY (prepared_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quotations_customer_id_fkey'
    ) THEN
        ALTER TABLE public.quotations
        ADD CONSTRAINT quotations_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 7. Broadcast Schema Cache Reload Notification to PostgREST
NOTIFY pgrst, 'reload schema';

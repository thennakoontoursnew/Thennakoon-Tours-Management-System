-- Migration: 20260725000000_go_live_reset.sql
-- Description: Owner-only Go Live Reset database engine. Extends company_settings, provides atomic RPC perform_go_live_reset, resets sequence numbering to 000001, and writes audit logs.

-- 1. Extend Company Settings Table for Go Live Status Tracking
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS go_live_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS go_live_at TIMESTAMPTZ;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS go_live_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create RPC Function: perform_go_live_reset
CREATE OR REPLACE FUNCTION public.perform_go_live_reset(
    p_confirmation TEXT,
    p_reason TEXT DEFAULT 'Preparing system for production use.',
    p_delete_vehicle_categories BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_go_live_completed BOOLEAN;
    v_current_year INTEGER;

    -- Deleted Row Counters
    v_cnt_document_logs BIGINT := 0;
    v_cnt_receipts BIGINT := 0;
    v_cnt_payments BIGINT := 0;
    v_cnt_invoice_items BIGINT := 0;
    v_cnt_invoices BIGINT := 0;
    v_cnt_agreements BIGINT := 0;
    v_cnt_booking_vehicles BIGINT := 0;
    v_cnt_bookings BIGINT := 0;
    v_cnt_quotation_items BIGINT := 0;
    v_cnt_quotations BIGINT := 0;
    v_cnt_driver_docs BIGINT := 0;
    v_cnt_drivers BIGINT := 0;
    v_cnt_vehicle_imgs BIGINT := 0;
    v_cnt_vehicles BIGINT := 0;
    v_cnt_categories BIGINT := 0;
    v_cnt_customers BIGINT := 0;

    v_result JSONB;
BEGIN
    -- Step 1: Authentication Check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to perform Go Live Reset.';
    END IF;

    -- Step 2: Role Authorization Check (Owner ONLY)
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    IF v_user_role IS NULL OR v_user_role != 'owner' THEN
        RAISE EXCEPTION 'Permission denied. Only the System Owner may perform Go Live Reset.';
    END IF;

    -- Step 3: Confirmation Phrase Check
    IF p_confirmation IS NULL OR TRIM(p_confirmation) != 'GO LIVE RESET' THEN
        RAISE EXCEPTION 'Invalid confirmation phrase. You must type exactly "GO LIVE RESET".';
    END IF;

    -- Step 4: Lockout Check
    SELECT COALESCE(go_live_completed, false) INTO v_go_live_completed FROM public.company_settings LIMIT 1;
    IF v_go_live_completed THEN
        RAISE EXCEPTION 'Go Live Reset has already been executed for this system. The production environment is live.';
    END IF;

    -- Step 5: Dependency-Safe Deletion Sequence
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_activity_logs') THEN
        WITH deleted AS (DELETE FROM public.document_activity_logs RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_document_logs FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN
        WITH deleted AS (DELETE FROM public.receipts RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_receipts FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        WITH deleted AS (DELETE FROM public.payments RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_payments FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        WITH deleted AS (DELETE FROM public.invoice_items RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_invoice_items FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        WITH deleted AS (DELETE FROM public.invoices RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_invoices FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_agreements') THEN
        WITH deleted AS (DELETE FROM public.rental_agreements RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_agreements FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_vehicles') THEN
        WITH deleted AS (DELETE FROM public.booking_vehicles RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_booking_vehicles FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        WITH deleted AS (DELETE FROM public.bookings RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_bookings FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items') THEN
        WITH deleted AS (DELETE FROM public.quotation_items RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_quotation_items FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations') THEN
        WITH deleted AS (DELETE FROM public.quotations RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_quotations FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_documents') THEN
        WITH deleted AS (DELETE FROM public.driver_documents RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_driver_docs FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        WITH deleted AS (DELETE FROM public.drivers RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_drivers FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_images') THEN
        WITH deleted AS (DELETE FROM public.vehicle_images RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_vehicle_imgs FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        WITH deleted AS (DELETE FROM public.vehicles RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_vehicles FROM deleted;
    END IF;

    IF p_delete_vehicle_categories AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_categories') THEN
        WITH deleted AS (DELETE FROM public.vehicle_categories RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_categories FROM deleted;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_tag_assignments') THEN
        DELETE FROM public.customer_tag_assignments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        WITH deleted AS (DELETE FROM public.customers RETURNING 1)
        SELECT COUNT(*) INTO v_cnt_customers FROM deleted;
    END IF;

    -- Step 6: Atomic Reset of Sequences to 1
    ALTER SEQUENCE IF EXISTS public.customer_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.vehicle_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.driver_code_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.quotation_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.booking_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.invoice_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.receipt_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.agreement_number_seq RESTART WITH 1;

    -- Step 7: Update Company Settings Go Live Status
    v_current_year := EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Colombo'))::INTEGER;
    UPDATE public.company_settings
    SET go_live_completed = true,
        go_live_at = NOW(),
        go_live_by = v_user_id;

    -- Step 8: Insert Final Preserved Audit Log Entry
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        description,
        metadata
    ) VALUES (
        v_user_id,
        'go_live_reset',
        'system',
        'Owner executed Go Live Reset to clear test operational data and restart production numbering.',
        jsonb_build_object(
            'reason', p_reason,
            'go_live_year', v_current_year,
            'deleted_counts', jsonb_build_object(
                'customers', v_cnt_customers,
                'vehicles', v_cnt_vehicles,
                'drivers', v_cnt_drivers,
                'quotations', v_cnt_quotations,
                'quotation_items', v_cnt_quotation_items,
                'bookings', v_cnt_bookings,
                'booking_vehicles', v_cnt_booking_vehicles,
                'invoices', v_cnt_invoices,
                'invoice_items', v_cnt_invoice_items,
                'payments', v_cnt_payments,
                'receipts', v_cnt_receipts,
                'rental_agreements', v_cnt_agreements,
                'document_activity_logs', v_cnt_document_logs
            )
        )
    );

    -- Step 9: Construct Return Summary
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Go Live Reset executed successfully. All test data removed and sequence numbering restarted.',
        'go_live_year', v_current_year,
        'next_numbers', jsonb_build_object(
            'customer_code', 'CUS-000001',
            'vehicle_code', 'VEH-000001',
            'driver_code', 'DRV-000001',
            'quotation_number', 'QT-' || v_current_year::TEXT || '-000001',
            'booking_number', 'BK-' || v_current_year::TEXT || '-000001',
            'invoice_number', 'INV-' || v_current_year::TEXT || '-000001',
            'receipt_number', 'RCPT-' || v_current_year::TEXT || '-000001',
            'agreement_number', 'AGR-' || v_current_year::TEXT || '-000001'
        ),
        'deleted_counts', jsonb_build_object(
            'customers', v_cnt_customers,
            'vehicles', v_cnt_vehicles,
            'drivers', v_cnt_drivers,
            'quotations', v_cnt_quotations,
            'quotation_items', v_cnt_quotation_items,
            'bookings', v_cnt_bookings,
            'booking_vehicles', v_cnt_booking_vehicles,
            'invoices', v_cnt_invoices,
            'invoice_items', v_cnt_invoice_items,
            'payments', v_cnt_payments,
            'receipts', v_cnt_receipts,
            'rental_agreements', v_cnt_agreements,
            'document_activity_logs', v_cnt_document_logs
        )
    );

    -- Step 10: Notify PostgREST to reload schema cache
    NOTIFY pgrst, 'reload schema';

    RETURN v_result;
END;
$$;

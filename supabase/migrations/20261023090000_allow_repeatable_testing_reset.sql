-- Migration: 20261023090000_allow_repeatable_testing_reset.sql
-- Description: Allow repeatable test data reset for Owner during testing phase without one-time lockout.

CREATE OR REPLACE FUNCTION public.perform_go_live_reset(
    p_confirmation TEXT,
    p_reason TEXT DEFAULT 'Clearing test data during testing phase.',
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
    v_current_year INTEGER;      
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
    v_cnt_leads BIGINT := 0; 
    v_cnt_expenses BIGINT := 0; 
BEGIN 
    -- 1. Check Authentication 
    v_user_id := auth.uid(); 
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'Authentication required.'; 
    END IF;      

    -- 2. Verify Owner Role 
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id; 
    IF v_user_role IS NULL OR v_user_role != 'owner' THEN 
        RAISE EXCEPTION 'Permission denied. Only Owner can perform test data reset.'; 
    END IF;      

    -- 3. Confirmation check 
    IF p_confirmation IS NULL OR (TRIM(p_confirmation) != 'RESET TEST DATA' AND TRIM(p_confirmation) != 'GO LIVE RESET') THEN 
        RAISE EXCEPTION 'Invalid confirmation phrase. Please type "RESET TEST DATA".'; 
    END IF;      

    -- 4. Delete Transactional Data (Preserving Master Records) 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_activity_logs') THEN 
        DELETE FROM public.document_activity_logs; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts') THEN 
        WITH del AS (DELETE FROM public.receipts RETURNING 1) SELECT COUNT(*) INTO v_cnt_receipts FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN 
        WITH del AS (DELETE FROM public.payments RETURNING 1) SELECT COUNT(*) INTO v_cnt_payments FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN 
        DELETE FROM public.invoice_items; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN 
        WITH del AS (DELETE FROM public.invoices RETURNING 1) SELECT COUNT(*) INTO v_cnt_invoices FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agreements') THEN 
        WITH del AS (DELETE FROM public.agreements RETURNING 1) SELECT COUNT(*) INTO v_cnt_agreements FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_agreements') THEN 
        WITH del AS (DELETE FROM public.rental_agreements RETURNING 1) SELECT v_cnt_agreements + COUNT(*) INTO v_cnt_agreements FROM del; 
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_vehicles') THEN 
        DELETE FROM public.booking_vehicles; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN 
        WITH del AS (DELETE FROM public.bookings RETURNING 1) SELECT COUNT(*) INTO v_cnt_bookings FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items') THEN 
        DELETE FROM public.quotation_items; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations') THEN 
        WITH del AS (DELETE FROM public.quotations RETURNING 1) SELECT COUNT(*) INTO v_cnt_quotations FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN 
        WITH del AS (DELETE FROM public.crm_leads RETURNING 1) SELECT COUNT(*) INTO v_cnt_leads FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN 
        WITH del AS (DELETE FROM public.expenses RETURNING 1) SELECT COUNT(*) INTO v_cnt_expenses FROM del; 
    END IF;      

    -- 5. Reset Document Sequence Counters (TT-IN-000001, QT-000001, etc.) 
    v_current_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::INTEGER; 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'number_counters') THEN 
        UPDATE public.number_counters SET current_value = 0 WHERE year = v_current_year; 
    END IF;      

    RETURN jsonb_build_object( 
        'success', true, 
        'message', 'Test data cleared successfully.', 
        'deleted', jsonb_build_object( 
            'quotations', v_cnt_quotations, 
            'bookings', v_cnt_bookings, 
            'agreements', v_cnt_agreements, 
            'invoices', v_cnt_invoices, 
            'payments', v_cnt_payments, 
            'receipts', v_cnt_receipts, 
            'expenses', v_cnt_expenses, 
            'leads', v_cnt_leads 
        ) 
    ); 
END; 
$$;

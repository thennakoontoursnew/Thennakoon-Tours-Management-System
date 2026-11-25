-- Migration: 20261125115243_allow_master_data_reset_option.sql
-- Description: Adds p_delete_master_data option to perform_go_live_reset RPC allowing Owner to wipe master test data (vehicles, drivers, customers, vehicle owners) on demand.

CREATE OR REPLACE FUNCTION public.perform_go_live_reset(
    p_confirmation TEXT,
    p_reason TEXT DEFAULT 'Clearing test data during testing phase.',
    p_delete_vehicle_categories BOOLEAN DEFAULT false,
    p_delete_master_data BOOLEAN DEFAULT false
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
    v_cnt_vehicles BIGINT := 0;
    v_cnt_drivers BIGINT := 0;
    v_cnt_customers BIGINT := 0;
    v_cnt_owners BIGINT := 0;
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

    -- 4. Delete Transactional Data (with explicit WHERE clauses) 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_activity_logs' AND table_schema = 'public') THEN 
        DELETE FROM public.document_activity_logs WHERE id IS NOT NULL; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receipts' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.receipts WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_receipts FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.payments WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_payments FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN 
        DELETE FROM public.invoice_items WHERE id IS NOT NULL; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_deductions' AND table_schema = 'public') THEN 
        DELETE FROM public.invoice_deductions WHERE id IS NOT NULL; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.invoices WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_invoices FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agreements' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.agreements WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_agreements FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_agreements' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.rental_agreements WHERE id IS NOT NULL RETURNING 1) SELECT v_cnt_agreements + COUNT(*) INTO v_cnt_agreements FROM del; 
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_vehicles' AND table_schema = 'public') THEN 
        DELETE FROM public.booking_vehicles WHERE id IS NOT NULL; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.bookings WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_bookings FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items' AND table_schema = 'public') THEN 
        DELETE FROM public.quotation_items WHERE id IS NOT NULL; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.quotations WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_quotations FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.crm_leads WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_leads FROM del; 
    END IF;      

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN 
        WITH del AS (DELETE FROM public.expenses WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_expenses FROM del; 
    END IF;      

    -- 5. Delete Master Data (Vehicles, Drivers, Customers, Owners) if requested
    IF p_delete_master_data THEN
        -- Unlink cross-references between master tables
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferred_vehicle_id') THEN
                UPDATE public.customers SET preferred_vehicle_id = NULL WHERE id IS NOT NULL;
            END IF;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_schema = 'public') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_owner_id') THEN
                UPDATE public.vehicles SET vehicle_owner_id = NULL WHERE id IS NOT NULL;
            END IF;
        END IF;

        -- Child tables of vehicles, drivers, customers, owners
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owner_agreement_vehicles' AND table_schema = 'public') THEN
            DELETE FROM public.owner_agreement_vehicles WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owner_agreements' AND table_schema = 'public') THEN
            DELETE FROM public.owner_agreements WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owner_payouts' AND table_schema = 'public') THEN
            DELETE FROM public.owner_payouts WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'owner_statements' AND table_schema = 'public') THEN
            DELETE FROM public.owner_statements WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_handover_checks' AND table_schema = 'public') THEN
            DELETE FROM public.booking_handover_checks WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_return_checks' AND table_schema = 'public') THEN
            DELETE FROM public.booking_return_checks WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_self_bookings' AND table_schema = 'public') THEN
            DELETE FROM public.customer_self_bookings WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_tracking_logs' AND table_schema = 'public') THEN
            DELETE FROM public.trip_tracking_logs WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_telemetry' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_telemetry WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_gps_locations' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_gps_locations WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_geofences' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_geofences WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_fuel_stats' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_fuel_stats WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_logs' AND table_schema = 'public') THEN
            DELETE FROM public.fuel_logs WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_odometer_logs' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_odometer_logs WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_damage_records' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_damage_records WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_inspections' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_inspections WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_task_items' AND table_schema = 'public') THEN
            DELETE FROM public.maintenance_task_items WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_tasks' AND table_schema = 'public') THEN
            DELETE FROM public.maintenance_tasks WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_photos' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_photos WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_images' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_images WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_documents' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_documents WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_status_history' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_status_history WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_assets' AND table_schema = 'public') THEN
            DELETE FROM public.marketing_assets WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_offers' AND table_schema = 'public') THEN
            DELETE FROM public.marketing_offers WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_documents' AND table_schema = 'public') THEN
            DELETE FROM public.driver_documents WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_incidents' AND table_schema = 'public') THEN
            DELETE FROM public.driver_incidents WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_notes' AND table_schema = 'public') THEN
            DELETE FROM public.driver_notes WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_unavailability' AND table_schema = 'public') THEN
            DELETE FROM public.driver_unavailability WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_documents' AND table_schema = 'public') THEN
            DELETE FROM public.customer_documents WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_notes' AND table_schema = 'public') THEN
            DELETE FROM public.customer_notes WHERE id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_tag_assignments' AND table_schema = 'public') THEN
            DELETE FROM public.customer_tag_assignments WHERE customer_id IS NOT NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refundable_deposits' AND table_schema = 'public') THEN
            DELETE FROM public.refundable_deposits WHERE id IS NOT NULL;
        END IF;

        -- Delete Master Tables
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_schema = 'public') THEN
            WITH del AS (DELETE FROM public.vehicles WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_vehicles FROM del;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers' AND table_schema = 'public') THEN
            WITH del AS (DELETE FROM public.drivers WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_drivers FROM del;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
            WITH del AS (DELETE FROM public.customers WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_customers FROM del;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_owners' AND table_schema = 'public') THEN
            WITH del AS (DELETE FROM public.vehicle_owners WHERE id IS NOT NULL RETURNING 1) SELECT COUNT(*) INTO v_cnt_owners FROM del;
        END IF;

        -- Reset Master Sequence Counters
        ALTER SEQUENCE IF EXISTS public.customer_code_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.vehicle_code_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.driver_code_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.customer_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.vehicle_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.driver_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.owner_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.vehicle_owner_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.vehicle_owner_number_seq_v2 RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.owner_agreement_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.owner_statement_number_seq RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.owner_settlement_number_seq_v2 RESTART WITH 1;
        ALTER SEQUENCE IF EXISTS public.owner_payout_number_seq RESTART WITH 1;
    END IF;

    -- 6. Optional Vehicle Categories reset
    IF p_delete_vehicle_categories THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_categories' AND table_schema = 'public') THEN
            DELETE FROM public.vehicle_categories WHERE id IS NOT NULL;
        END IF;
    END IF;

    -- 7. Reset Document Sequence Counters (TT-IN-000001, QT-000001, etc.) 
    v_current_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::INTEGER; 
    ALTER SEQUENCE IF EXISTS public.quotation_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.booking_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.invoice_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.receipt_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.agreement_number_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS public.lead_number_seq RESTART WITH 1;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'number_counters' AND table_schema = 'public') THEN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'number_counters' AND column_name = 'last_value') THEN
            UPDATE public.number_counters SET last_value = 10000 WHERE document_type = 'invoice';
            UPDATE public.number_counters SET last_value = 0 WHERE document_type != 'invoice';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'number_counters' AND column_name = 'current_value') THEN
            EXECUTE 'UPDATE public.number_counters SET current_value = 0 WHERE year = $1' USING v_current_year;
        END IF;
    END IF;      

    RETURN jsonb_build_object( 
        'success', true, 
        'message', 'Test data cleared successfully.', 
        'master_data_wiped', p_delete_master_data,
        'deleted', jsonb_build_object( 
            'quotations', v_cnt_quotations, 
            'bookings', v_cnt_bookings, 
            'agreements', v_cnt_agreements, 
            'invoices', v_cnt_invoices, 
            'payments', v_cnt_payments, 
            'receipts', v_cnt_receipts, 
            'expenses', v_cnt_expenses, 
            'leads', v_cnt_leads,
            'vehicles', v_cnt_vehicles,
            'drivers', v_cnt_drivers,
            'customers', v_cnt_customers,
            'owners', v_cnt_owners
        ) 
    ); 
END; 
$$;

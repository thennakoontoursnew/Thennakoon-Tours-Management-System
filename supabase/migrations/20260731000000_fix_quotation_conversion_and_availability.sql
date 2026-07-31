-- Migration: 20260731000000_fix_quotation_conversion_and_availability.sql
-- Description: Ensures bookings table schema has purpose and notes columns, adds unique constraint for 1:1 active booking conversion, and provides atomic conversion RPC.

-- 1. Ensure required columns exist on public.bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Unique constraint: Prevents more than one active booking per quotation
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_booking_per_quotation
ON public.bookings (quotation_id)
WHERE (status NOT IN ('cancelled', 'no_show') AND quotation_id IS NOT NULL);

-- 3. Transaction-Safe Atomic Conversion RPC
CREATE OR REPLACE FUNCTION public.convert_quotation_to_booking_rpc(
    p_quotation_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_qt RECORD;
    v_cust RECORD;
    v_existing_booking_id UUID;
    v_existing_booking_num TEXT;
    v_item RECORD;
    v_start_at TIMESTAMPTZ;
    v_end_at TIMESTAMPTZ;
    v_booking_id UUID;
    v_booking_number TEXT;
    v_avail RECORD;
    v_item_count INTEGER := 0;
    v_veh_name TEXT;
    v_year INTEGER;
    v_result JSONB;
BEGIN
    -- Step 1: Fetch Quotation Header
    SELECT * INTO v_qt FROM public.quotations WHERE id = p_quotation_id;
    IF v_qt.id IS NULL THEN
        RAISE EXCEPTION 'Quotation not found.';
    END IF;

    IF COALESCE(v_qt.is_archived, false) THEN
        RAISE EXCEPTION 'Archived quotation cannot be converted to booking.';
    END IF;

    IF v_qt.status != 'accepted' THEN
        RAISE EXCEPTION 'Quotation must be accepted before conversion.';
    END IF;

    -- Step 2: Check for existing active booking from this quotation
    SELECT id, booking_number INTO v_existing_booking_id, v_existing_booking_num
    FROM public.bookings
    WHERE quotation_id = p_quotation_id AND status NOT IN ('cancelled', 'no_show')
    LIMIT 1;

    IF v_existing_booking_id IS NOT NULL THEN
        RAISE EXCEPTION 'This quotation has already been converted to booking %', v_existing_booking_num;
    END IF;

    -- Step 3: Check customer exists
    SELECT * INTO v_cust FROM public.customers WHERE id = v_qt.customer_id;
    IF v_cust.id IS NULL THEN
        RAISE EXCEPTION 'Customer record for this quotation was not found.';
    END IF;

    -- Step 4: Check quotation items exist
    SELECT COUNT(*) INTO v_item_count FROM public.quotation_items WHERE quotation_id = p_quotation_id;
    IF v_item_count = 0 THEN
        RAISE EXCEPTION 'Quotation has no vehicle items to convert.';
    END IF;

    -- Step 5: Calculate start & end TIMESTAMPTZ for booking & booking_vehicles
    v_start_at := (v_qt.rental_start_date::TEXT || ' 00:00:00')::TIMESTAMPTZ;
    v_end_at := (v_qt.rental_end_date::TEXT || ' 23:59:59')::TIMESTAMPTZ;

    -- Step 6: Check vehicle availability for each quotation item
    FOR v_item IN SELECT * FROM public.quotation_items WHERE quotation_id = p_quotation_id LOOP
        IF v_item.vehicle_id IS NOT NULL THEN
            SELECT vehicle_name INTO v_veh_name FROM public.vehicles WHERE id = v_item.vehicle_id;

            SELECT * INTO v_avail FROM public.check_vehicle_availability(
                v_item.vehicle_id,
                v_start_at,
                v_end_at,
                NULL
            );

            IF v_avail.is_available = false THEN
                RAISE EXCEPTION 'Vehicle % is unavailable for the selected dates (% to %). %',
                    COALESCE(v_veh_name, 'selected'),
                    v_qt.rental_start_date,
                    v_qt.rental_end_date,
                    COALESCE(v_avail.conflict_reason, '');
            END IF;
        END IF;
    END LOOP;

    -- Step 7: Generate Atomic Booking Number using sequence
    v_year := EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Colombo'))::INTEGER;
    v_booking_number := public.generate_next_booking_number(v_year);

    -- Step 8: Insert Bookings Row
    INSERT INTO public.bookings (
        booking_number,
        quotation_id,
        customer_id,
        booking_date,
        rental_start_at,
        rental_end_at,
        pickup_location,
        dropoff_location,
        destination,
        passenger_count,
        purpose,
        subtotal,
        discount_amount,
        tax_amount,
        refundable_deposit,
        grand_total,
        advance_required,
        advance_paid,
        balance_due,
        status,
        notes,
        created_by,
        updated_by
    ) VALUES (
        v_booking_number,
        v_qt.id,
        v_qt.customer_id,
        CURRENT_DATE,
        v_start_at,
        v_end_at,
        v_qt.pickup_location,
        v_qt.dropoff_location,
        v_qt.destination,
        v_qt.passenger_count,
        v_qt.purpose,
        v_qt.subtotal,
        v_qt.discount_amount,
        v_qt.tax_amount,
        v_qt.refundable_deposit,
        v_qt.grand_total,
        v_qt.refundable_deposit,
        0,
        v_qt.grand_total,
        'confirmed',
        v_qt.notes,
        COALESCE(p_user_id, auth.uid(), v_qt.created_by),
        COALESCE(p_user_id, auth.uid(), v_qt.updated_by)
    ) RETURNING id INTO v_booking_id;

    -- Step 9: Insert Booking Vehicles Rows for all items
    FOR v_item IN SELECT * FROM public.quotation_items WHERE quotation_id = p_quotation_id LOOP
        IF v_item.vehicle_id IS NOT NULL THEN
            INSERT INTO public.booking_vehicles (
                booking_id,
                vehicle_id,
                rental_start_at,
                rental_end_at,
                vehicle_rate,
                driver_charge,
                deposit_amount,
                allowed_km,
                extra_km_charge,
                status
            ) VALUES (
                v_booking_id,
                v_item.vehicle_id,
                v_start_at,
                v_end_at,
                v_item.unit_rate,
                v_item.driver_charge,
                v_item.deposit_amount,
                v_item.allowed_km,
                v_item.extra_km_charge,
                'reserved'
            );
        END IF;
    END LOOP;

    -- Step 10: Audit Logging
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            description,
            metadata
        ) VALUES (
            COALESCE(p_user_id, auth.uid()),
            'CONVERT_QUOTATION_TO_BOOKING',
            'booking',
            v_booking_id,
            'Converted quotation ' || v_qt.quotation_number || ' to booking ' || v_booking_number,
            jsonb_build_object(
                'quotation_id', v_qt.id,
                'quotation_number', v_qt.quotation_number,
                'booking_number', v_booking_number,
                'grand_total', v_qt.grand_total
            )
        );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_activity_logs') THEN
        INSERT INTO public.document_activity_logs (
            document_type,
            document_id,
            action,
            actor_id,
            details
        ) VALUES (
            'quotation',
            v_qt.id,
            'converted_to_booking',
            COALESCE(p_user_id, auth.uid()),
            jsonb_build_object('booking_id', v_booking_id, 'booking_number', v_booking_number)
        );
    END IF;

    -- Step 11: Return Result Payload
    v_result := jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_number', v_booking_number
    );

    RETURN v_result;
END;
$$;

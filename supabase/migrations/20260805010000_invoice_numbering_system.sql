-- Migration: Invoice Numbering System & Counter Synchronization
-- File: supabase/migrations/20260805010000_invoice_numbering_system.sql

-- 1. Create number_counters table if not exists
CREATE TABLE IF NOT EXISTS public.number_counters (
    document_type TEXT PRIMARY KEY,
    prefix TEXT NOT NULL DEFAULT 'TT-IN-',
    last_value BIGINT NOT NULL DEFAULT 10000,
    padding INTEGER NOT NULL DEFAULT 5,
    allow_manual_edit BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on number_counters
ALTER TABLE public.number_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Number counters view policy" ON public.number_counters;
CREATE POLICY "Number counters view policy" ON public.number_counters
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Number counters manage policy" ON public.number_counters;
CREATE POLICY "Number counters manage policy" ON public.number_counters
    FOR ALL TO authenticated USING (true);

-- 2. Audit existing invoice records to initialize last_value safely
DO $$
DECLARE
    v_max_val BIGINT := 10000;
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT invoice_number 
        FROM public.invoices 
        WHERE invoice_number LIKE 'TT-IN-%'
    LOOP
        BEGIN
            v_max_val := GREATEST(v_max_val, substring(v_rec.invoice_number from 7)::BIGINT);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore non-numeric trailing formats
        END;
    END LOOP;

    INSERT INTO public.number_counters (document_type, prefix, last_value, padding, allow_manual_edit)
    VALUES ('invoice', 'TT-IN-', v_max_val, 5, true)
    ON CONFLICT (document_type) DO UPDATE
    SET last_value = GREATEST(public.number_counters.last_value, EXCLUDED.last_value),
        prefix = 'TT-IN-';
END $$;

-- 3. Replace generate_next_invoice_number function to be atomic and thread-safe
CREATE OR REPLACE FUNCTION public.generate_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prefix TEXT;
    v_last_val BIGINT;
    v_padding INT;
    v_next_val BIGINT;
BEGIN
    SELECT prefix, last_value, padding
    INTO v_prefix, v_last_val, v_padding
    FROM public.number_counters
    WHERE document_type = 'invoice'
    FOR UPDATE;

    IF NOT FOUND THEN
        v_prefix := 'TT-IN-';
        v_last_val := 10000;
        v_padding := 5;
        INSERT INTO public.number_counters (document_type, prefix, last_value, padding, allow_manual_edit)
        VALUES ('invoice', v_prefix, v_last_val, v_padding, true)
        ON CONFLICT (document_type) DO NOTHING;
    END IF;

    v_next_val := v_last_val + 1;

    UPDATE public.number_counters
    SET last_value = v_next_val,
        updated_at = NOW()
    WHERE document_type = 'invoice';

    RETURN v_prefix || LPAD(v_next_val::TEXT, v_padding, '0');
END;
$$;

-- 4. Function to synchronize number_counters when a manual high invoice number is saved
CREATE OR REPLACE FUNCTION public.sync_invoice_counter(p_invoice_number TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prefix TEXT;
    v_num_str TEXT;
    v_num_val BIGINT;
BEGIN
    SELECT prefix INTO v_prefix FROM public.number_counters WHERE document_type = 'invoice';
    IF v_prefix IS NULL THEN v_prefix := 'TT-IN-'; END IF;

    IF p_invoice_number LIKE v_prefix || '%' THEN
        v_num_str := substring(p_invoice_number from char_length(v_prefix) + 1);
        IF v_num_str ~ '^\d+$' THEN
            v_num_val := v_num_str::BIGINT;
            UPDATE public.number_counters
            SET last_value = GREATEST(last_value, v_num_val),
                updated_at = NOW()
            WHERE document_type = 'invoice' AND v_num_val > last_value;
        END IF;
    END IF;
END;
$$;

-- Phase 3 Migration: Sales, Booking, and Document Engine
-- Database schema for Quotations, Bookings, Invoices, Payments, Receipts, Rental Agreements, and Activity Logging.

-- 1. Extend Company Settings Table
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS booking_prefix TEXT DEFAULT 'BK';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS agreement_prefix TEXT DEFAULT 'AGR';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_account_name TEXT DEFAULT 'Thennakoon Tours (Pvt) Ltd';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Nations Trust Bank';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_branch TEXT DEFAULT 'Nugegoda';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '100-200-300400';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS bank_swift_code TEXT DEFAULT 'NTBKLKLX';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS payment_instruction TEXT DEFAULT 'Please send bank transfer deposit receipt to WhatsApp +94 77 123 4567 quoting your document number.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_quotation_terms TEXT DEFAULT '1. Quotation valid for 7 days from issue date. 2. 25% advance deposit required upon booking confirmation. 3. Rates include standard comprehensive insurance.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_invoice_terms TEXT DEFAULT '1. Payment due upon receipt. 2. Please mention Invoice Number on all bank transfers.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_agreement_terms TEXT DEFAULT '1. Hirer is responsible for vehicle during rental period. 2. Fuel level must match pickup level. 3. Excess mileage charged at specified rate.';

-- 2. Concurrency-Safe Number Generator Sequences
CREATE SEQUENCE IF NOT EXISTS public.quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.agreement_number_seq START 1;

-- Functions for Atomic Document Number Generation
CREATE OR REPLACE FUNCTION public.generate_next_quotation_number(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
    prefix_str TEXT;
BEGIN
    SELECT COALESCE(quotation_prefix, 'QT') INTO prefix_str FROM public.company_settings LIMIT 1;
    IF prefix_str IS NULL THEN prefix_str := 'QT'; END IF;
    next_val := nextval('public.quotation_number_seq');
    RETURN prefix_str || '-' || target_year::TEXT || '-' || lpad(next_val::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_booking_number(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
    prefix_str TEXT;
BEGIN
    SELECT COALESCE(booking_prefix, 'BK') INTO prefix_str FROM public.company_settings LIMIT 1;
    IF prefix_str IS NULL THEN prefix_str := 'BK'; END IF;
    next_val := nextval('public.booking_number_seq');
    RETURN prefix_str || '-' || target_year::TEXT || '-' || lpad(next_val::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_invoice_number(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
    prefix_str TEXT;
BEGIN
    SELECT COALESCE(invoice_prefix, 'INV') INTO prefix_str FROM public.company_settings LIMIT 1;
    IF prefix_str IS NULL THEN prefix_str := 'INV'; END IF;
    next_val := nextval('public.invoice_number_seq');
    RETURN prefix_str || '-' || target_year::TEXT || '-' || lpad(next_val::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_receipt_number(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
    prefix_str TEXT;
BEGIN
    SELECT COALESCE(receipt_prefix, 'RCPT') INTO prefix_str FROM public.company_settings LIMIT 1;
    IF prefix_str IS NULL THEN prefix_str := 'RCPT'; END IF;
    next_val := nextval('public.receipt_number_seq');
    RETURN prefix_str || '-' || target_year::TEXT || '-' || lpad(next_val::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_agreement_number(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    next_val BIGINT;
    prefix_str TEXT;
BEGIN
    SELECT COALESCE(agreement_prefix, 'AGR') INTO prefix_str FROM public.company_settings LIMIT 1;
    IF prefix_str IS NULL THEN prefix_str := 'AGR'; END IF;
    next_val := nextval('public.agreement_number_seq');
    RETURN prefix_str || '-' || target_year::TEXT || '-' || lpad(next_val::TEXT, 6, '0');
END;
$$;

-- 3. Quotations & Quotation Items Tables
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT NOT NULL UNIQUE DEFAULT public.generate_next_quotation_number(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until TIMESTAMPTZ,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    pickup_location TEXT,
    dropoff_location TEXT,
    destination TEXT,
    passenger_count INTEGER,
    purpose TEXT,
    currency TEXT NOT NULL DEFAULT 'LKR',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_type TEXT DEFAULT 'none',
    discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    refundable_deposit NUMERIC(14,2) NOT NULL DEFAULT 0,
    additional_charges NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes TEXT,
    special_notes TEXT,
    terms_and_conditions TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    parent_quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    prepared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_quotation_dates CHECK (rental_end_date >= rental_start_date),
    CONSTRAINT check_quotation_money CHECK (
        subtotal >= 0 AND discount_value >= 0 AND discount_amount >= 0 AND
        tax_rate >= 0 AND tax_amount >= 0 AND refundable_deposit >= 0 AND
        additional_charges >= 0 AND grand_total >= 0
    ),
    CONSTRAINT check_quotation_discount_type CHECK (discount_type IN ('none', 'percentage', 'fixed')),
    CONSTRAINT check_quotation_status CHECK (status IN ('draft', 'generated', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
    CONSTRAINT check_quotation_version CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    vehicle_name_snapshot TEXT,
    vehicle_registration_snapshot TEXT,
    vehicle_year_snapshot INTEGER,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    number_of_days NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    allowed_km NUMERIC(12,2),
    extra_km_charge NUMERIC(12,2),
    deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    driver_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
    additional_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_quotation_item_money CHECK (
        quantity > 0 AND number_of_days > 0 AND unit_rate >= 0 AND line_total >= 0 AND
        deposit_amount >= 0 AND driver_charge >= 0 AND additional_charge >= 0
    )
);

-- 4. Bookings & Booking Vehicles Tables
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT NOT NULL UNIQUE DEFAULT public.generate_next_booking_number(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rental_start_at TIMESTAMPTZ NOT NULL,
    rental_end_at TIMESTAMPTZ NOT NULL,
    pickup_location TEXT,
    dropoff_location TEXT,
    destination TEXT,
    passenger_count INTEGER,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    refundable_deposit NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    advance_required NUMERIC(14,2) NOT NULL DEFAULT 0,
    advance_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(14,2) NOT NULL DEFAULT 0,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_booking_dates CHECK (rental_end_at > rental_start_at),
    CONSTRAINT check_booking_money CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND
        refundable_deposit >= 0 AND grand_total >= 0 AND advance_required >= 0 AND
        advance_paid >= 0 AND balance_due >= 0
    ),
    CONSTRAINT check_booking_status CHECK (status IN ('pending', 'confirmed', 'vehicle_assigned', 'driver_assigned', 'ready', 'on_trip', 'completed', 'cancelled', 'no_show'))
);

CREATE TABLE IF NOT EXISTS public.booking_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    rental_start_at TIMESTAMPTZ NOT NULL,
    rental_end_at TIMESTAMPTZ NOT NULL,
    vehicle_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
    driver_charge NUMERIC(14,2) NOT NULL DEFAULT 0,
    deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    allowed_km NUMERIC(12,2),
    extra_km_charge NUMERIC(12,2),
    pickup_mileage NUMERIC(12,2),
    return_mileage NUMERIC(12,2),
    pickup_fuel_level NUMERIC(8,2),
    return_fuel_level NUMERIC(8,2),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'reserved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_booking_vehicle_unique UNIQUE (booking_id, vehicle_id),
    CONSTRAINT check_booking_vehicle_dates CHECK (rental_end_at > rental_start_at),
    CONSTRAINT check_booking_vehicle_money CHECK (vehicle_rate >= 0 AND driver_charge >= 0 AND deposit_amount >= 0)
);

-- 5. Vehicle Availability Engine Function
CREATE OR REPLACE FUNCTION public.check_vehicle_availability(
    p_vehicle_id UUID,
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    is_available BOOLEAN,
    conflict_reason TEXT,
    conflicting_booking_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_conflict_booking_id UUID;
    v_conflict_booking_num TEXT;
BEGIN
    -- Check Vehicle Operational Status
    SELECT status INTO v_status FROM public.vehicles WHERE id = p_vehicle_id;
    IF v_status = 'maintenance' THEN
        RETURN QUERY SELECT false, 'Vehicle is currently under maintenance'::TEXT, NULL::TEXT;
        RETURN;
    ELSIF v_status = 'inactive' THEN
        RETURN QUERY SELECT false, 'Vehicle is marked as inactive'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check overlap with active bookings
    SELECT b.id, b.booking_number
    INTO v_conflict_booking_id, v_conflict_booking_num
    FROM public.booking_vehicles bv
    JOIN public.bookings b ON b.id = bv.booking_id
    WHERE bv.vehicle_id = p_vehicle_id
      AND b.status NOT IN ('cancelled', 'no_show')
      AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
      AND (bv.rental_start_at < p_end_at AND bv.rental_end_at > p_start_at)
    LIMIT 1;

    IF v_conflict_booking_id IS NOT NULL THEN
        RETURN QUERY SELECT false, ('Vehicle has an overlapping booking (' || v_conflict_booking_num || ')')::TEXT, v_conflict_booking_num;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, 'Vehicle is available'::TEXT, NULL::TEXT;
END;
$$;

-- 6. Invoices & Invoice Items Tables
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE DEFAULT public.generate_next_invoice_number(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_terms TEXT,
    nature_of_invoice TEXT,
    delivery_date DATE,
    currency TEXT NOT NULL DEFAULT 'LKR',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    refundable_deposit NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(14,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    special_notes TEXT,
    important_message TEXT,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    prepared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_invoice_money CHECK (
        subtotal >= 0 AND discount_amount >= 0 AND tax_rate >= 0 AND tax_amount >= 0 AND
        refundable_deposit >= 0 AND total_deductions >= 0 AND grand_total >= 0 AND
        amount_paid >= 0 AND balance_due >= 0
    ),
    CONSTRAINT check_invoice_status CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_invoice_item_money CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0)
);

-- 7. Payments & Receipts Tables
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    amount NUMERIC(14,2) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    bank_name TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    payment_slip_path TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_payment_amount CHECK (amount > 0),
    CONSTRAINT check_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'online', 'cheque', 'other')),
    CONSTRAINT check_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE DEFAULT public.generate_next_receipt_number(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    amount NUMERIC(14,2) NOT NULL,
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    status TEXT NOT NULL DEFAULT 'generated',
    notes TEXT,
    prepared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_receipt_amount CHECK (amount > 0),
    CONSTRAINT check_receipt_unique_payment UNIQUE (payment_id)
);

-- 8. Rental Agreements Table
CREATE TABLE IF NOT EXISTS public.rental_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_number TEXT NOT NULL UNIQUE DEFAULT public.generate_next_agreement_number(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    agreement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rental_start_at TIMESTAMPTZ NOT NULL,
    rental_end_at TIMESTAMPTZ NOT NULL,
    terms_snapshot TEXT NOT NULL,
    customer_signature_path TEXT,
    company_signature_path TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    generated_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    prepared_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_agreement_dates CHECK (rental_end_at > rental_start_at),
    CONSTRAINT check_agreement_status CHECK (status IN ('draft', 'generated', 'signed', 'completed', 'cancelled'))
);

-- 9. Document Activity Logs Table
CREATE TABLE IF NOT EXISTS public.document_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL,
    document_id UUID NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    change_summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_document_type CHECK (document_type IN ('quotation', 'booking', 'invoice', 'payment', 'receipt', 'rental_agreement'))
);

-- 10. Database Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON public.quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quotation_id ON public.bookings(quotation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON public.bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_booking_vehicles_booking_id ON public.booking_vehicles(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_vehicles_vehicle_id ON public.booking_vehicles(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON public.receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_booking_id ON public.rental_agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_doc_activity_doc ON public.document_activity_logs(document_type, document_id);

-- 11. Idempotent Triggers for Updated At
DROP TRIGGER IF EXISTS set_quotations_updated_at ON public.quotations;
CREATE TRIGGER set_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_quotation_items_updated_at ON public.quotation_items;
CREATE TRIGGER set_quotation_items_updated_at BEFORE UPDATE ON public.quotation_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_booking_vehicles_updated_at ON public.booking_vehicles;
CREATE TRIGGER set_booking_vehicles_updated_at BEFORE UPDATE ON public.booking_vehicles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_invoice_items_updated_at ON public.invoice_items;
CREATE TRIGGER set_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_rental_agreements_updated_at ON public.rental_agreements;
CREATE TRIGGER set_rental_agreements_updated_at BEFORE UPDATE ON public.rental_agreements FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 12. Row Level Security Policies (Non-Recursive)
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_activity_logs ENABLE ROW LEVEL SECURITY;

-- Clean Up Old Policies
DROP POLICY IF EXISTS "Quotations policy" ON public.quotations;
DROP POLICY IF EXISTS "Quotation items policy" ON public.quotation_items;
DROP POLICY IF EXISTS "Bookings policy" ON public.bookings;
DROP POLICY IF EXISTS "Booking vehicles policy" ON public.booking_vehicles;
DROP POLICY IF EXISTS "Invoices policy" ON public.invoices;
DROP POLICY IF EXISTS "Invoice items policy" ON public.invoice_items;
DROP POLICY IF EXISTS "Payments policy" ON public.payments;
DROP POLICY IF EXISTS "Receipts policy" ON public.receipts;
DROP POLICY IF EXISTS "Rental agreements policy" ON public.rental_agreements;
DROP POLICY IF EXISTS "Document activity logs policy" ON public.document_activity_logs;

-- Quotations Policy
CREATE POLICY "Quotations policy" ON public.quotations
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'marketing_staff', 'viewer')
    );

-- Quotation Items Policy
CREATE POLICY "Quotation items policy" ON public.quotation_items
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'marketing_staff', 'viewer')
    );

-- Bookings Policy
CREATE POLICY "Bookings policy" ON public.bookings
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- Booking Vehicles Policy
CREATE POLICY "Booking vehicles policy" ON public.booking_vehicles
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- Invoices Policy
CREATE POLICY "Invoices policy" ON public.invoices
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- Invoice Items Policy
CREATE POLICY "Invoice items policy" ON public.invoice_items
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- Payments Policy
CREATE POLICY "Payments policy" ON public.payments
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'finance_staff', 'booking_staff', 'viewer')
    );

-- Receipts Policy
CREATE POLICY "Receipts policy" ON public.receipts
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'finance_staff', 'booking_staff', 'viewer')
    );

-- Rental Agreements Policy
CREATE POLICY "Rental agreements policy" ON public.rental_agreements
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- Document Activity Logs Policy
CREATE POLICY "Document activity logs policy" ON public.document_activity_logs
    FOR ALL USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'marketing_staff', 'viewer')
    );

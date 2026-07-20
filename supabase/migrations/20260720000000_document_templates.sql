-- Migration: 20260720000000_document_templates.sql
-- Description: Create document_templates table, seed default templates, extend document tables with snapshot columns, and enable non-recursive RLS policies.

-- 1. Create document_templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL UNIQUE CHECK (document_type IN ('quotation', 'invoice', 'receipt', 'rental_agreement')),
    title TEXT NOT NULL,
    special_notes TEXT,
    important_message TEXT,
    bank_details JSONB DEFAULT '{
        "bank_name": "Bank of Ceylon",
        "bank_branch": "Colombo Super Grade",
        "bank_account_name": "Thennakoon Tours (Pvt) Ltd",
        "bank_account_number": "000123456789",
        "bank_swift_code": "BCEYLKLX"
    }'::jsonb,
    prepared_by_label TEXT DEFAULT 'Authorized Officer',
    default_terms TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed Default Templates
INSERT INTO public.document_templates (
    document_type,
    title,
    special_notes,
    important_message,
    bank_details,
    prepared_by_label,
    default_terms
) VALUES (
    'quotation',
    'Quotation Template',
    '1. Quotation valid for 7 calendar days from issuance.\n2. Fuel level on return must match pickup level.\n3. Driver accommodation and meals included unless specified otherwise.',
    'Thank you for choosing Thennakoon Tours for your journey! We look forward to serving you with excellence.',
    '{
        "bank_name": "Bank of Ceylon",
        "bank_branch": "Colombo Super Grade",
        "bank_account_name": "Thennakoon Tours (Pvt) Ltd",
        "bank_account_number": "000123456789",
        "bank_swift_code": "BCEYLKLX"
    }'::jsonb,
    'Authorized Reservation Officer',
    'Standard Thennakoon Tours quotation terms and conditions apply.'
), (
    'invoice',
    'Invoice Template',
    '1. Payment due within 7 days of invoice date.\n2. Late payments subject to a 2% monthly surcharge.',
    'Please send payment receipt confirmation to info@thennakoontours.com once transferred.',
    '{
        "bank_name": "Bank of Ceylon",
        "bank_branch": "Colombo Super Grade",
        "bank_account_name": "Thennakoon Tours (Pvt) Ltd",
        "bank_account_number": "000123456789",
        "bank_swift_code": "BCEYLKLX"
    }'::jsonb,
    'Accounts Manager',
    'Standard Thennakoon Tours billing terms apply.'
), (
    'receipt',
    'Payment Receipt Template',
    'Official Proof of Payment. Retain this receipt for your records.',
    'Payment received with thanks. We appreciate your business!',
    '{
        "bank_name": "Bank of Ceylon",
        "bank_branch": "Colombo Super Grade",
        "bank_account_name": "Thennakoon Tours (Pvt) Ltd",
        "bank_account_number": "000123456789",
        "bank_swift_code": "BCEYLKLX"
    }'::jsonb,
    'Finance Cashier',
    'This is a computer-generated receipt.'
), (
    'rental_agreement',
    'Rental Agreement Template',
    '1. Hirer is fully responsible for vehicle condition during the rental period.\n2. Any traffic fines or toll charges incurred will be charged to the hirer.',
    'Please inspect vehicle condition with our representative before departure.',
    '{
        "bank_name": "Bank of Ceylon",
        "bank_branch": "Colombo Super Grade",
        "bank_account_name": "Thennakoon Tours (Pvt) Ltd",
        "bank_account_number": "000123456789",
        "bank_swift_code": "BCEYLKLX"
    }'::jsonb,
    'Fleet Manager',
    'Standard Thennakoon Tours vehicle rental agreement terms apply.'
)
ON CONFLICT (document_type) DO NOTHING;

-- 3. Extend Document Tables with Snapshot Columns
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS important_message TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_details_snapshot JSONB;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS prepared_by_label_snapshot TEXT;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS important_message TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bank_details_snapshot JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS prepared_by_label_snapshot TEXT;

ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS important_message TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS bank_details_snapshot JSONB;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS prepared_by_label_snapshot TEXT;

ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS important_message TEXT;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS bank_details_snapshot JSONB;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS prepared_by_label_snapshot TEXT;

-- 4. Idempotent Updated At Trigger
DROP TRIGGER IF EXISTS set_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER set_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Row Level Security Policies
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Document templates policy" ON public.document_templates;
CREATE POLICY "Document templates policy" ON public.document_templates
    FOR ALL
    TO authenticated
    USING (public.is_user_active(auth.uid()))
    WITH CHECK (public.is_user_active(auth.uid()));

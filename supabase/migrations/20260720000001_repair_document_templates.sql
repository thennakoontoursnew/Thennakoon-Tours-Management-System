-- Migration: 20260720000001_repair_document_templates.sql
-- Description: Backward-compatible schema repair for document_templates, supporting legacy columns (title, bank_details, prepared_by_label, terms_and_conditions) and new normalized columns.

-- 1. Ensure public.set_current_timestamp_updated_at function exists with explicit search_path
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

-- 2. Create public.document_templates Table IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL UNIQUE CHECK (document_type IN ('quotation', 'invoice', 'receipt', 'rental_agreement')),
    title TEXT,
    display_name TEXT,
    special_notes TEXT,
    important_message TEXT,
    bank_account_name TEXT,
    bank_name TEXT,
    bank_branch TEXT,
    bank_account_number TEXT,
    bank_swift_code TEXT,
    payment_instructions TEXT,
    prepared_by_designation TEXT,
    company_name TEXT,
    default_terms_and_conditions TEXT,
    bank_details JSONB,
    prepared_by_label TEXT,
    terms_and_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Comprehensive Column Addition (IF NOT EXISTS)
ALTER TABLE public.document_templates
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

-- 4. Safely Drop NOT NULL on legacy title column if present to prevent insert crashes
ALTER TABLE public.document_templates ALTER COLUMN title DROP NOT NULL;

-- 5. Bi-Directional Backfilling for Title and Display Name
UPDATE public.document_templates
SET display_name = COALESCE(display_name, title)
WHERE display_name IS NULL AND title IS NOT NULL;

UPDATE public.document_templates
SET title = COALESCE(title, display_name, initcap(replace(document_type, '_', ' ')) || ' Template')
WHERE title IS NULL;

-- 6. Add Foreign Keys Safely IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'document_templates_created_by_fkey'
        AND table_name = 'document_templates'
    ) THEN
        ALTER TABLE public.document_templates
        ADD CONSTRAINT document_templates_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'document_templates_updated_by_fkey'
        AND table_name = 'document_templates'
    ) THEN
        ALTER TABLE public.document_templates
        ADD CONSTRAINT document_templates_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Updated At Trigger & RLS Policies
DROP TRIGGER IF EXISTS set_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER set_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Document templates select policy" ON public.document_templates;
CREATE POLICY "Document templates select policy" ON public.document_templates
    FOR SELECT
    TO authenticated
    USING (public.is_user_active(auth.uid()));

DROP POLICY IF EXISTS "Document templates write policy" ON public.document_templates;
CREATE POLICY "Document templates write policy" ON public.document_templates
    FOR ALL
    TO authenticated
    USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager')
    )
    WITH CHECK (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager')
    );

-- 8. Backward-Compatible Seed Data (Populates BOTH legacy and new fields)
INSERT INTO public.document_templates (
    document_type,
    title,
    display_name,
    special_notes,
    important_message,
    bank_account_name,
    bank_name,
    bank_branch,
    bank_account_number,
    bank_swift_code,
    payment_instructions,
    prepared_by_designation,
    company_name,
    default_terms_and_conditions,
    bank_details,
    prepared_by_label,
    terms_and_conditions,
    is_active
) VALUES (
    'quotation',
    'Standard Quotation Template',
    'Standard Quotation Template',
    '• 700km allowed.
• This quotation is valid for 24 hours only.
• Vehicles are subject to availability.
• If a booking is cancelled after making the advance payment, the advance payment is non-refundable.
• Above rates exclude tax charges.
• To reserve a vehicle, a minimum advance payment is required.',
    'Please find the account details below. Kindly ensure the payment is made on or before the due date to the mentioned account. Once the payment is completed, please WhatsApp the payment slip to the company contact number and mention the vehicle registration number as the reference.',
    'Thennakoon Tours (Pvt) Ltd',
    'Nations Trust Bank',
    'Nugegoda',
    '100530013140',
    'NTBCLKLX',
    'Kindly ensure payment is completed on or before the due date. Please mention vehicle registration number as reference.',
    'Admin & Marketing Assistant',
    'Thennakoon Tours (Pvt) Ltd',
    'Standard Thennakoon Tours quotation terms and conditions apply.',
    jsonb_build_object(
        'account_name', 'Thennakoon Tours (Pvt) Ltd',
        'bank_name', 'Nations Trust Bank',
        'bank_branch', 'Nugegoda',
        'account_number', '100530013140',
        'swift_code', 'NTBCLKLX'
    ),
    'Admin & Marketing Assistant',
    'Standard Thennakoon Tours quotation terms and conditions apply.',
    true
), (
    'invoice',
    'Standard Invoice Template',
    'Standard Invoice Template',
    '• Payment due within 7 days of invoice date.
• Late payments subject to a 2% monthly surcharge.',
    'Please send payment receipt confirmation to info@thennakoontours.com once transferred.',
    'Thennakoon Tours (Pvt) Ltd',
    'Nations Trust Bank',
    'Nugegoda',
    '100530013140',
    'NTBCLKLX',
    'Please send bank transfer receipt with invoice number as reference.',
    'Accounts Manager',
    'Thennakoon Tours (Pvt) Ltd',
    'Standard Thennakoon Tours billing terms apply.',
    jsonb_build_object(
        'account_name', 'Thennakoon Tours (Pvt) Ltd',
        'bank_name', 'Nations Trust Bank',
        'bank_branch', 'Nugegoda',
        'account_number', '100530013140',
        'swift_code', 'NTBCLKLX'
    ),
    'Accounts Manager',
    'Standard Thennakoon Tours billing terms apply.',
    true
), (
    'receipt',
    'Standard Receipt Template',
    'Standard Receipt Template',
    'Official Proof of Payment. Retain this receipt for your records.',
    'Payment received with thanks. We appreciate your business!',
    'Thennakoon Tours (Pvt) Ltd',
    'Nations Trust Bank',
    'Nugegoda',
    '100530013140',
    'NTBCLKLX',
    'Payment completed successfully.',
    'Finance Cashier',
    'Thennakoon Tours (Pvt) Ltd',
    'This is a computer-generated receipt.',
    jsonb_build_object(
        'account_name', 'Thennakoon Tours (Pvt) Ltd',
        'bank_name', 'Nations Trust Bank',
        'bank_branch', 'Nugegoda',
        'account_number', '100530013140',
        'swift_code', 'NTBCLKLX'
    ),
    'Finance Cashier',
    'This is a computer-generated receipt.',
    true
), (
    'rental_agreement',
    'Standard Rental Agreement Template',
    'Standard Rental Agreement Template',
    '• Hirer is fully responsible for vehicle condition during the rental period.
• Any traffic fines or toll charges incurred will be charged to the hirer.',
    'Please inspect vehicle condition with our representative before departure.',
    'Thennakoon Tours (Pvt) Ltd',
    'Nations Trust Bank',
    'Nugegoda',
    '100530013140',
    'NTBCLKLX',
    'Security deposit required prior to vehicle handover.',
    'Fleet Manager',
    'Thennakoon Tours (Pvt) Ltd',
    'Standard Thennakoon Tours vehicle rental agreement terms apply.',
    jsonb_build_object(
        'account_name', 'Thennakoon Tours (Pvt) Ltd',
        'bank_name', 'Nations Trust Bank',
        'bank_branch', 'Nugegoda',
        'account_number', '100530013140',
        'swift_code', 'NTBCLKLX'
    ),
    'Fleet Manager',
    'Standard Thennakoon Tours vehicle rental agreement terms apply.',
    true
)
ON CONFLICT (document_type) DO NOTHING;

-- 9. Broadcast Schema Cache Reload Notification to PostgREST
NOTIFY pgrst, 'reload schema';

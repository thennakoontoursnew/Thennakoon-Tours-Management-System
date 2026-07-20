-- Migration: 20260720000000_document_templates.sql
-- Description: Database-backed document template system with explicit typed columns, default template seed, quotation snapshot columns, and RBAC RLS policies.

-- 1. Create public.document_templates Table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL UNIQUE CHECK (document_type IN ('quotation', 'invoice', 'receipt', 'rental_agreement')),
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
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed Default Quotation, Invoice, Receipt, and Rental Agreement Templates
INSERT INTO public.document_templates (
    document_type,
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
    is_active
) VALUES (
    'quotation',
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
    true
), (
    'invoice',
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
    true
), (
    'receipt',
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
    true
), (
    'rental_agreement',
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
    true
)
ON CONFLICT (document_type) DO UPDATE SET
    special_notes = EXCLUDED.special_notes,
    important_message = EXCLUDED.important_message,
    bank_account_name = EXCLUDED.bank_account_name,
    bank_name = EXCLUDED.bank_name,
    bank_branch = EXCLUDED.bank_branch,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_swift_code = EXCLUDED.bank_swift_code,
    payment_instructions = EXCLUDED.payment_instructions,
    prepared_by_designation = EXCLUDED.prepared_by_designation,
    company_name = EXCLUDED.company_name,
    default_terms_and_conditions = EXCLUDED.default_terms_and_conditions;

-- 3. Extend public.quotations with Explicit Snapshot Columns
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS important_message TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_account_name_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_name_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_branch_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_account_number_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS bank_swift_code_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS payment_instructions_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS prepared_by_name_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS prepared_by_designation_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS company_name_snapshot TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS terms_and_conditions_snapshot TEXT;

-- 4. Idempotent Updated At Trigger
DROP TRIGGER IF EXISTS set_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER set_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Row Level Security Policies for Document Templates
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

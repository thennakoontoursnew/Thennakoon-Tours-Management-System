-- Migration: Multiple Invoice Deductions Upgrade
-- Purpose: Supports structured multiple line-item deductions per commercial invoice

CREATE TABLE IF NOT EXISTS public.invoice_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_deductions_invoice_id ON public.invoice_deductions (invoice_id);

ALTER TABLE public.invoice_deductions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoice deductions policy" ON public.invoice_deductions;
DROP POLICY IF EXISTS "Invoice deductions select policy" ON public.invoice_deductions;
DROP POLICY IF EXISTS "Invoice deductions insert policy" ON public.invoice_deductions;
DROP POLICY IF EXISTS "Invoice deductions update policy" ON public.invoice_deductions;
DROP POLICY IF EXISTS "Invoice deductions delete policy" ON public.invoice_deductions;

-- SELECT Policy (Canonical Invoice View Roles)
CREATE POLICY "Invoice deductions select policy" ON public.invoice_deductions
    FOR SELECT USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer')
    );

-- INSERT Policy (Canonical Invoice Write Roles)
CREATE POLICY "Invoice deductions insert policy" ON public.invoice_deductions
    FOR INSERT WITH CHECK (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager', 'finance_staff', 'booking_staff')
    );

-- UPDATE Policy (Canonical Invoice Write Roles)
CREATE POLICY "Invoice deductions update policy" ON public.invoice_deductions
    FOR UPDATE USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager', 'finance_staff', 'booking_staff')
    ) WITH CHECK (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager', 'finance_staff', 'booking_staff')
    );

-- DELETE Policy (Canonical Invoice Write Roles)
CREATE POLICY "Invoice deductions delete policy" ON public.invoice_deductions
    FOR DELETE USING (
        public.is_user_active(auth.uid()) AND
        public.get_user_role(auth.uid()) IN ('owner', 'admin', 'manager', 'finance_staff', 'booking_staff')
    );

DROP TRIGGER IF EXISTS set_invoice_deductions_updated_at ON public.invoice_deductions;
CREATE TRIGGER set_invoice_deductions_updated_at
    BEFORE UPDATE ON public.invoice_deductions
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

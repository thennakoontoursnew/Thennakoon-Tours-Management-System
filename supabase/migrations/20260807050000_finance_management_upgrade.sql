-- Migration: 20260807050000_finance_management_upgrade.sql
-- Purpose: Finance, Invoicing, Payments, Receipts, and Expense Management Upgrade (Fresh-Database Safe)

-- 1. Create public.expenses Table if not exists
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT NOT NULL UNIQUE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    supplier_name TEXT,
    reference_number TEXT,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure receipt_url column exists if table existed previously without it
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 2. Refundable Deposits Tracking Table
CREATE TABLE IF NOT EXISTS public.refundable_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'required' CHECK (status IN ('required', 'received', 'partially_refunded', 'refunded', 'forfeited')),
    forfeited_reason TEXT,
    received_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add Unique Constraint on Receipts (One receipt per payment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_receipt_payment'
  ) THEN
    ALTER TABLE public.receipts ADD CONSTRAINT uq_receipt_payment UNIQUE (payment_id);
  END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refundable_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_policy" ON public.expenses;
CREATE POLICY "expenses_policy" ON public.expenses FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "refundable_deposits_policy" ON public.refundable_deposits;
CREATE POLICY "refundable_deposits_policy" ON public.refundable_deposits FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON public.invoices (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_status ON public.payments (invoice_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON public.expenses (expense_date, category);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON public.expenses (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_driver ON public.expenses (driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_booking ON public.expenses (booking_id);

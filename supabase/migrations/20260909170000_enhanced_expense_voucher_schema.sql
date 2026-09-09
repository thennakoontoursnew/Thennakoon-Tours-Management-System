-- Migration: 20260909170000_enhanced_expense_voucher_schema.sql
-- Purpose: Add structured voucher fields for Operating Expenses & Owner Statements

ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS voucher_number TEXT,
ADD COLUMN IF NOT EXISTS bill_name TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS add_payments_breakdown JSONB,
ADD COLUMN IF NOT EXISTS deduction_breakdown JSONB,
ADD COLUMN IF NOT EXISTS net_balance NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS remark TEXT,
ADD COLUMN IF NOT EXISTS special_notice TEXT,
ADD COLUMN IF NOT EXISTS prepared_by TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_voucher_number ON public.expenses (voucher_number);

-- Migration: Add terms_and_conditions column to receipts table
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS terms_and_conditions text;

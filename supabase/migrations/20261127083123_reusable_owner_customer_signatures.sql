-- Migration: 20261127083123_reusable_owner_customer_signatures.sql
-- Purpose: Add reusable signature_url on vehicle_owners and customers, and recipient_signature_url on agreement_extensions.

ALTER TABLE public.vehicle_owners ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.agreement_extensions ADD COLUMN IF NOT EXISTS recipient_signature_url TEXT;

-- Migration: Add E-Signature URL support to profiles and company_settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS signature_url TEXT;

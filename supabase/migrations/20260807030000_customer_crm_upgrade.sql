-- Migration: 20260807030000_customer_crm_upgrade.sql
-- Purpose: Customer Relationship Management (CRM) schema tables, sequences, and indexes

-- 1. Add extra CRM columns to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS risk_flag TEXT DEFAULT 'normal' CHECK (risk_flag IN ('normal', 'watch', 'restricted'));
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS risk_reason TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS risk_set_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS risk_set_at TIMESTAMPTZ;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email'));
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS preferred_transmission TEXT DEFAULT 'any';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Create Lead Number Sequence & Function
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TEXT AS $$
DECLARE
  v_next_val INT;
  v_year TEXT;
BEGIN
  v_next_val := nextval('lead_number_seq');
  v_year := to_char(CURRENT_DATE, 'YYYY');
  RETURN 'LD-' || v_year || '-' || lpad(v_next_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Customer Documents Vault Table
CREATE TABLE IF NOT EXISTS public.customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('nic_front', 'nic_back', 'passport', 'driving_license', 'company_registration', 'authorization_letter', 'other')),
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Customer Internal Notes Table
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'booking', 'payment', 'complaint', 'preference', 'risk', 'other')),
    is_important BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CRM Leads & Enquiries Pipeline Table
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_number TEXT NOT NULL UNIQUE DEFAULT public.generate_lead_number(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    prospect_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('facebook', 'instagram', 'tiktok', 'whatsapp', 'phone_call', 'website', 'google', 'walk_in', 'referral', 'existing_customer', 'other')),
    enquiry_type TEXT DEFAULT 'rental',
    interested_vehicle_name TEXT,
    pickup_date DATE,
    return_date DATE,
    pickup_location TEXT,
    destination TEXT,
    estimated_budget NUMERIC(14,2),
    notes TEXT,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quotation_sent', 'negotiating', 'won', 'lost')),
    lost_reason TEXT,
    lost_notes TEXT,
    lost_at TIMESTAMPTZ,
    lost_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    follow_up_date DATE,
    follow_up_notes TEXT,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS & Policies
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_documents_policy" ON public.customer_documents;
CREATE POLICY "customer_documents_policy" ON public.customer_documents FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "customer_notes_policy" ON public.customer_notes;
CREATE POLICY "customer_notes_policy" ON public.customer_notes FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "crm_leads_policy" ON public.crm_leads;
CREATE POLICY "crm_leads_policy" ON public.crm_leads FOR ALL USING (auth.uid() IS NOT NULL);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers (mobile);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers (whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_nic ON public.customers (nic);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);

CREATE INDEX IF NOT EXISTS idx_crm_leads_status_followup ON public.crm_leads (status, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_customer_id ON public.crm_leads (customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads (source);

CREATE INDEX IF NOT EXISTS idx_customer_notes_cid ON public.customer_notes (customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_customer_documents_cid ON public.customer_documents (customer_id);

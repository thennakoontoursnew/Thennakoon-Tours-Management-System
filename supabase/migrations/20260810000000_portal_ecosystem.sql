-- Migration: 20260810000000_portal_ecosystem.sql
-- Purpose: Stage 13 — Portal Ecosystem & Customer Self-Booking Schema
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- 1. Extend customers with portal access fields
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_portal_active BOOLEAN DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS portal_access_code TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_portal_login_at TIMESTAMPTZ;

-- 2. Extend drivers with portal access fields
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_portal_active BOOLEAN DEFAULT true;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS portal_pin TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_portal_login_at TIMESTAMPTZ;

-- 3. Extend bookings with self-booking origin tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'internal' CHECK (booking_source IN ('internal', 'self_booking', 'website', 'mobile_app'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS self_booking_status TEXT DEFAULT 'approved' CHECK (self_booking_status IN ('pending_approval', 'approved', 'rejected'));

-- 4. Customer Self-Booking Requests Table
CREATE TABLE IF NOT EXISTS public.customer_self_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT UNIQUE NOT NULL, -- SBR-YYYY-XXXXXX
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_email TEXT,
    vehicle_category_id UUID REFERENCES public.vehicle_categories(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    passenger_count INT DEFAULT 1,
    with_driver BOOLEAN DEFAULT true,
    estimated_amount NUMERIC(12,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Portal Notifications Table
CREATE TABLE IF NOT EXISTS public.portal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'driver', 'owner')),
    recipient_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Sequence Generator for Self-Booking Requests
CREATE SEQUENCE IF NOT EXISTS public.self_booking_request_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_self_booking_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.self_booking_request_seq') INTO next_num;
  RETURN 'SBR-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- 7. Enable RLS and Policies
ALTER TABLE public.customer_self_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_self_bookings_policy" ON public.customer_self_bookings;
CREATE POLICY "customer_self_bookings_policy" ON public.customer_self_bookings FOR ALL USING (true); -- Allow public self-booking requests

DROP POLICY IF EXISTS "portal_notifications_policy" ON public.portal_notifications;
CREATE POLICY "portal_notifications_policy" ON public.portal_notifications FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customer_self_bookings_status ON public.customer_self_bookings (status, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_recipient ON public.portal_notifications (recipient_type, recipient_id, is_read);

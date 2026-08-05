-- Migration: Booking Detail Improvements & Unique Active Agreement Policy
-- File: supabase/migrations/20260805000000_booking_detail_improvements.sql

-- 1. Partial unique index to enforce ONE active agreement per booking
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_agreement_per_booking
ON public.rental_agreements (booking_id)
WHERE booking_id IS NOT NULL
AND status NOT IN ('cancelled');

-- 2. Ensure booking status constraint supports standard operational workflow statuses
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS check_booking_status;

ALTER TABLE public.bookings
ADD CONSTRAINT check_booking_status
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'on_trip', 'completed', 'closed', 'cancelled', 'no_show'));

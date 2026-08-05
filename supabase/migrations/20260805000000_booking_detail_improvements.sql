-- Migration: Booking Detail Improvements & Unique Active Agreement Policy
-- File: supabase/migrations/20260805000000_booking_detail_improvements.sql

-- Step 1 & 2: Safely resolve existing duplicate active agreements in production DB
-- For any booking with multiple non-cancelled rental agreements, keep the earliest created active,
-- and set status='cancelled' on accidental later duplicates. Preserve all rows and history.
WITH ranked_agreements AS (
  SELECT id, booking_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.rental_agreements
  WHERE booking_id IS NOT NULL
  AND status NOT IN ('cancelled')
)
UPDATE public.rental_agreements
SET status = 'cancelled',
    updated_at = NOW()
WHERE id IN (
  SELECT id FROM ranked_agreements WHERE rn > 1
);

-- Step 3: Create partial unique index to enforce ONE active agreement per booking at DB level
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_agreement_per_booking
ON public.rental_agreements (booking_id)
WHERE booking_id IS NOT NULL
AND status NOT IN ('cancelled');

-- Step 4: Ensure booking status constraint supports standard operational workflow statuses
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS check_booking_status;

ALTER TABLE public.bookings
ADD CONSTRAINT check_booking_status
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'on_trip', 'completed', 'closed', 'cancelled', 'no_show'));

-- Migration: 20260807000000_dashboard_performance_indexes.sql
-- Purpose: Performance indexes for real-time dashboard query aggregations

DROP INDEX IF EXISTS public.idx_bookings_rental_dates;

CREATE INDEX IF NOT EXISTS idx_bookings_rental_dates ON public.bookings (rental_start_at, rental_end_at);
CREATE INDEX IF NOT EXISTS idx_booking_vehicles_driver_id ON public.booking_vehicles (driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices (due_date);

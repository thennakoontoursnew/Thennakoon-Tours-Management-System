-- Performance Indexes for High-Traffic Dashboard & Booking Queries
CREATE INDEX IF NOT EXISTS idx_payments_status_date 
  ON payments(status, payment_date);

CREATE INDEX IF NOT EXISTS idx_bookings_status_dates 
  ON bookings(status, rental_start_at, rental_end_at) 
  WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_invoices_status 
  ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_vehicles_status 
  ON vehicles(status) 
  WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_booking_vehicles_composite 
  ON booking_vehicles(booking_id, vehicle_id);

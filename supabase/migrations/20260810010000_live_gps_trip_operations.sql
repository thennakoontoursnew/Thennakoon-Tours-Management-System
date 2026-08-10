-- Migration: 20260810010000_live_gps_trip_operations.sql
-- Purpose: Stage 14 — Live GPS Telematics, Trip Tracking Logs & Mobile PWA Operations
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- 1. Vehicle GPS Telematics Table
CREATE TABLE IF NOT EXISTS public.vehicle_gps_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed_kmh NUMERIC(5, 1) DEFAULT 0,
    heading NUMERIC(5, 1) DEFAULT 0,
    ignition_on BOOLEAN DEFAULT true,
    battery_level_pct INT DEFAULT 100,
    location_name TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vehicle Geofence Table
CREATE TABLE IF NOT EXISTS public.vehicle_geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geofence_name TEXT NOT NULL,
    center_latitude NUMERIC(10, 7) NOT NULL,
    center_longitude NUMERIC(10, 7) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 5000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trip Tracking Event Logs Table
CREATE TABLE IF NOT EXISTS public.trip_tracking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('pickup_started', 'handover_completed', 'waypoint_reached', 'return_started', 'return_completed', 'inspection_photo')),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    odometer_reading NUMERIC(12,2),
    fuel_level_pct INT,
    photo_url TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS and Policies
ALTER TABLE public.vehicle_gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_tracking_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_gps_locations_policy" ON public.vehicle_gps_locations;
CREATE POLICY "vehicle_gps_locations_policy" ON public.vehicle_gps_locations FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "vehicle_geofences_policy" ON public.vehicle_geofences;
CREATE POLICY "vehicle_geofences_policy" ON public.vehicle_geofences FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "trip_tracking_logs_policy" ON public.trip_tracking_logs;
CREATE POLICY "trip_tracking_logs_policy" ON public.trip_tracking_logs FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gps_locations_vid ON public.vehicle_gps_locations (vehicle_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_trip_tracking_logs_booking ON public.trip_tracking_logs (booking_id, recorded_at);

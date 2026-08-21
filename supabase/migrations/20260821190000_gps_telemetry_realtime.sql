-- Safe Migration: GPS Telemetry Ingestion & Realtime Tracking Support

-- 1. Add telemetry columns to vehicles table if not present
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tracker_id text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS last_telemetry_at timestamptz;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_latitude numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_longitude numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_speed numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_battery integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS telemetry_status text DEFAULT 'offline';

-- Index tracker_id on vehicles for fast webhook lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_tracker_id ON public.vehicles (tracker_id);

-- 2. Create vehicle_telemetry log table if not present
CREATE TABLE IF NOT EXISTS public.vehicle_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tracker_id text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed numeric DEFAULT 0,
  battery_level integer DEFAULT 100,
  heading numeric DEFAULT 0,
  raw_payload jsonb,
  location_name text,
  created_at timestamptz DEFAULT now()
);

-- Index vehicle_telemetry for fast history lookup
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_vehicle_created ON public.vehicle_telemetry (vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_tracker_id ON public.vehicle_telemetry (tracker_id);

-- RLS policies for vehicle_telemetry
ALTER TABLE public.vehicle_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read vehicle_telemetry" ON public.vehicle_telemetry;
CREATE POLICY "Allow authenticated read vehicle_telemetry"
  ON public.vehicle_telemetry FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all insert vehicle_telemetry" ON public.vehicle_telemetry;
CREATE POLICY "Allow all insert vehicle_telemetry"
  ON public.vehicle_telemetry FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read vehicle_telemetry" ON public.vehicle_telemetry;
CREATE POLICY "Allow anon read vehicle_telemetry"
  ON public.vehicle_telemetry FOR SELECT TO anon USING (true);

-- 3. Enable Supabase Realtime on vehicle_telemetry and vehicles tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicle_telemetry'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_telemetry;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
END $$;

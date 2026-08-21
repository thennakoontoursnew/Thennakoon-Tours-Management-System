-- Migration: Fix Row Level Security policies for company_settings table
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Drop conflicting/restrictive policies
DROP POLICY IF EXISTS "Allow authenticated read company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow authenticated upsert company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow all access to company_settings for authenticated users" ON public.company_settings;
DROP POLICY IF EXISTS "Allow anon read company_settings" ON public.company_settings;

-- Permissive policy for authenticated staff/admin
CREATE POLICY "Allow all access to company_settings for authenticated users"
  ON public.company_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous read if needed for public PDF rendering
CREATE POLICY "Allow anon read company_settings"
  ON public.company_settings
  FOR SELECT
  TO anon
  USING (true);

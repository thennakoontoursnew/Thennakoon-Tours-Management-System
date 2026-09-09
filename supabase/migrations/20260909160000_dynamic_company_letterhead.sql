-- Migration: 20260909160000_dynamic_company_letterhead.sql
-- Purpose: Add dynamic letterhead URL column to company_settings and setup company-assets storage bucket

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS letterhead_url TEXT;

-- Create public storage bucket for company branding assets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access policy for company assets
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Access to Company Assets'
  ) THEN 
    CREATE POLICY "Public Access to Company Assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'company-assets');
  END IF; 
END $$;

-- Authenticated user insert/update policy
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Authenticated Upload to Company Assets'
  ) THEN 
    CREATE POLICY "Authenticated Upload to Company Assets"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'company-assets')
    WITH CHECK (bucket_id = 'company-assets');
  END IF; 
END $$;

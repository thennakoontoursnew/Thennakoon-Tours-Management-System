-- Migration: 20260807090000_marketing_management_upgrade.sql
-- Purpose: Stage 10 Marketing Management & Growth Operations Upgrade (Fresh-Database Safe)

-- 1. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT NOT NULL DEFAULT 'Lead Generation',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'paused', 'completed', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    actual_spend NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    target_audience TEXT,
    platforms TEXT[] DEFAULT '{}'::text[],
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Marketing Offers Table
CREATE TABLE IF NOT EXISTS public.marketing_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    offer_type TEXT NOT NULL DEFAULT 'Percentage Discount',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'expired', 'paused', 'cancelled')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount', 'special_rate')),
    discount_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    promo_code TEXT UNIQUE,
    minimum_booking_value NUMERIC(12,2) DEFAULT 0.00,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    terms TEXT,
    usage_limit INTEGER DEFAULT 100,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Marketing Content Table
CREATE TABLE IF NOT EXISTS public.marketing_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'Facebook Post',
    platforms TEXT[] DEFAULT '{facebook}'::text[],
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.marketing_offers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'in_production', 'ready_for_review', 'approved', 'scheduled', 'published', 'rejected', 'cancelled', 'archived')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    content_pillar TEXT DEFAULT 'Vehicle Showcase',
    target_audience TEXT,
    objective TEXT DEFAULT 'Awareness',
    planned_publish_at TIMESTAMPTZ,
    actual_publish_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    caption TEXT,
    hashtags TEXT,
    script TEXT,
    cta TEXT,
    post_url TEXT,
    external_post_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_archived BOOLEAN NOT NULL DEFAULT false
);

-- 4. Marketing Assets Table
CREATE TABLE IF NOT EXISTS public.marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'Image',
    platform TEXT DEFAULT 'facebook',
    category TEXT DEFAULT 'General',
    file_url TEXT NOT NULL,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    content_id UUID REFERENCES public.marketing_content(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_archived BOOLEAN NOT NULL DEFAULT false
);

-- 5. Social Accounts Table
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'google_business', 'website')),
    account_name TEXT NOT NULL,
    account_handle TEXT,
    profile_url TEXT,
    connection_status TEXT NOT NULL DEFAULT 'manual' CHECK (connection_status IN ('not_connected', 'manual', 'connected', 'error')),
    data_source TEXT NOT NULL DEFAULT 'manual' CHECK (data_source IN ('manual', 'import', 'api')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Social Metric Snapshots Table
CREATE TABLE IF NOT EXISTS public.social_metric_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    followers INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_social_snapshot UNIQUE (social_account_id, metric_date)
);

-- 7. Social Content Metrics Table
CREATE TABLE IF NOT EXISTS public.social_content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketing_content_id UUID REFERENCES public.marketing_content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    external_post_id TEXT,
    post_url TEXT,
    metric_date DATE NOT NULL,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default social accounts safely
INSERT INTO public.social_accounts (platform, account_name, account_handle, connection_status, data_source)
VALUES
  ('facebook', 'Thennakoon Tours Facebook', '@thennakoontours', 'manual', 'manual'),
  ('instagram', 'Thennakoon Tours Instagram', '@thennakoontours_lk', 'manual', 'manual'),
  ('tiktok', 'Thennakoon Tours TikTok', '@thennakoontours', 'manual', 'manual'),
  ('youtube', 'Thennakoon Tours YouTube', '@thennakoontours', 'manual', 'manual')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_policy" ON public.marketing_campaigns;
CREATE POLICY "campaigns_policy" ON public.marketing_campaigns FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "offers_policy" ON public.marketing_offers;
CREATE POLICY "offers_policy" ON public.marketing_offers FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_policy" ON public.marketing_content;
CREATE POLICY "content_policy" ON public.marketing_content FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "assets_policy" ON public.marketing_assets;
CREATE POLICY "assets_policy" ON public.marketing_assets FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "social_accounts_policy" ON public.social_accounts;
CREATE POLICY "social_accounts_policy" ON public.social_accounts FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "social_snapshots_policy" ON public.social_metric_snapshots;
CREATE POLICY "social_snapshots_policy" ON public.social_metric_snapshots FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "content_metrics_policy" ON public.social_content_metrics;
CREATE POLICY "content_metrics_policy" ON public.social_content_metrics FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON public.marketing_content (status, planned_publish_at);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON public.marketing_campaigns (status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_marketing_offers_dates ON public.marketing_offers (status, start_at, end_at);

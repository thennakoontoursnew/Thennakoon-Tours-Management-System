-- Migration: 20260807120000_ai_management_intelligence.sql
-- Purpose: Stage 12 — AI Reports, Management Intelligence & Revenue Forecasting Schema
-- Fresh-Database Safe: All statements use IF NOT EXISTS / IF EXISTS guards

-- ============================================================
-- 1. AI Generated Reports Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number TEXT UNIQUE NOT NULL, -- AIR-YYYY-XXXXXX format
    report_type TEXT NOT NULL CHECK (report_type IN ('executive', 'finance', 'fleet', 'marketing', 'crm', 'maintenance', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'archived')),
    metric_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_output JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider TEXT NOT NULL DEFAULT 'deterministic',
    model TEXT,
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. AI Insights Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_number TEXT UNIQUE NOT NULL, -- AII-YYYY-XXXXXX format
    category TEXT NOT NULL CHECK (category IN ('finance', 'bookings', 'fleet', 'crm', 'marketing', 'maintenance', 'operations')),
    priority TEXT NOT NULL DEFAULT 'informational' CHECK (priority IN ('critical', 'high', 'opportunity', 'informational')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    evidence JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    period_start DATE,
    period_end DATE,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed')),
    generated_report_id UUID REFERENCES public.ai_generated_reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. AI Forecasts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_number TEXT UNIQUE NOT NULL, -- FCT-YYYY-XXXXXX format
    forecast_type TEXT NOT NULL CHECK (forecast_type IN ('revenue_7d', 'revenue_30d', 'revenue_90d', 'booking_demand', 'fleet_demand')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    forecast_value NUMERIC(14,2) NOT NULL DEFAULT 0,
    lower_bound NUMERIC(14,2) NOT NULL DEFAULT 0,
    upper_bound NUMERIC(14,2) NOT NULL DEFAULT 0,
    confidence_level TEXT NOT NULL DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),
    data_quality TEXT NOT NULL DEFAULT 'insufficient' CHECK (data_quality IN ('excellent', 'good', 'limited', 'insufficient')),
    methodology TEXT,
    data_snapshot JSONB DEFAULT '{}'::jsonb,
    actual_value NUMERIC(14,2),
    accuracy_percentage NUMERIC(8,2),
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. AI Query Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    intent TEXT NOT NULL,
    response_summary TEXT,
    context_metadata JSONB DEFAULT '{}'::jsonb,
    provider TEXT,
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Atomic Number Sequence Generators (AIR-YYYY-XXXXXX, AII-YYYY-XXXXXX, FCT-YYYY-XXXXXX)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.ai_report_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.ai_insight_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.ai_forecast_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_next_ai_report_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.ai_report_number_seq') INTO next_num;
  RETURN 'AIR-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_ai_insight_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.ai_insight_number_seq') INTO next_num;
  RETURN 'AII-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_next_ai_forecast_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  curr_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
  next_num INT;
BEGIN
  SELECT nextval('public.ai_forecast_number_seq') INTO next_num;
  RETURN 'FCT-' || curr_year || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- 6. Enable RLS and Policies
-- ============================================================
ALTER TABLE public.ai_generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_generated_reports_policy" ON public.ai_generated_reports;
CREATE POLICY "ai_generated_reports_policy" ON public.ai_generated_reports FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ai_insights_policy" ON public.ai_insights;
CREATE POLICY "ai_insights_policy" ON public.ai_insights FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ai_forecasts_policy" ON public.ai_forecasts;
CREATE POLICY "ai_forecasts_policy" ON public.ai_forecasts FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ai_query_logs_policy" ON public.ai_query_logs;
CREATE POLICY "ai_query_logs_policy" ON public.ai_query_logs FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 7. Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_generated_reports_type ON public.ai_generated_reports (report_type, generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON public.ai_insights (priority, status, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_forecasts_type ON public.ai_forecasts (forecast_type, generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user ON public.ai_query_logs (user_id, created_at);

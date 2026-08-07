-- Migration: 20260807080000_reports_analytics_upgrade.sql
-- Purpose: Stage 9 Reports Center & Analytics Consolidation Upgrade (Fresh-Database Safe)

-- 1. Saved Report Presets Table
CREATE TABLE IF NOT EXISTS public.report_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    report_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    filters JSONB DEFAULT '{}'::jsonb,
    group_by TEXT,
    sort_config JSONB DEFAULT '{}'::jsonb,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Report Execution Audit Logs Table
CREATE TABLE IF NOT EXISTS public.report_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    format TEXT NOT NULL DEFAULT 'screen' CHECK (format IN ('screen', 'csv', 'pdf', 'print')),
    row_count INTEGER DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.report_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_presets_policy" ON public.report_presets;
CREATE POLICY "report_presets_policy" ON public.report_presets FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "report_execution_logs_policy" ON public.report_execution_logs;
CREATE POLICY "report_execution_logs_policy" ON public.report_execution_logs FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_report_presets_user ON public.report_presets (user_id, report_id);
CREATE INDEX IF NOT EXISTS idx_report_logs_executed ON public.report_execution_logs (executed_at, report_id);

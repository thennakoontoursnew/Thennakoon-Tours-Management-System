'use client'

import { AIForecastResult } from '@/lib/ai/ai-types'
import { TrendingUp, AlertCircle, Info, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react'

interface ForecastDashboardProps {
  forecasts: {
    revenue7d: AIForecastResult
    revenue30d: AIForecastResult
    revenue90d: AIForecastResult
  }
}

const CONFIDENCE_BADGES: Record<string, string> = {
  high: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  low: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
}

export function ForecastDashboard({ forecasts }: ForecastDashboardProps) {
  const cards = [
    { title: '7-Day Revenue Forecast', result: forecasts.revenue7d },
    { title: '30-Day Revenue Forecast', result: forecasts.revenue30d },
    { title: '90-Day Revenue Forecast', result: forecasts.revenue90d },
  ]

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Authoritative Forecast Disclaimer: </strong>
          Forecasts are estimates calculated from historical completed payments and confirmed future booking pipelines. They are not guaranteed future revenue.
        </div>
      </div>

      {/* Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(({ title, result }) => (
          <div key={title} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${CONFIDENCE_BADGES[result.confidence_level] || ''}`}>
                  {result.confidence_level} Confidence
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Projected Revenue</span>
                <span className="font-mono font-black text-2xl text-slate-900 dark:text-white">
                  LKR {result.forecast_value.toLocaleString()}
                </span>
              </div>

              {/* Range Bounds */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Confidence Range:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    LKR {result.lower_bound.toLocaleString()} – LKR {result.upper_bound.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Data Quality:</span>
                  <span className="font-mono font-bold text-amber-600 capitalize">{result.data_quality}</span>
                </div>
              </div>

              {/* Explanation */}
              {result.explanation && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{result.explanation}"
                </p>
              )}
            </div>

            {/* Methodology */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              <strong className="font-semibold text-slate-500">Methodology: </strong>
              {result.methodology}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

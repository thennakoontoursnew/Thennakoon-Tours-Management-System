'use client'

import { AIExecutiveBriefData, SanitizedAIContext } from '@/lib/ai/ai-types'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Car,
  CalendarCheck,
  Users,
  Wrench,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface AIExecutiveBriefProps {
  brief: AIExecutiveBriefData
  context: SanitizedAIContext
  providerName: string
}

export function AIExecutiveBrief({ brief, context, providerName }: AIExecutiveBriefProps) {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 text-white rounded-2xl border border-amber-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Executive Brief &bull; Provider: {providerName}
          </div>
          <h2 className="text-lg font-black tracking-tight">{brief.businessPerformanceSummary}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl text-xs font-mono font-bold">
            Data Quality: {context.dataQuality.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Comparisons Grid */}
      {brief.comparisons.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {brief.comparisons.map((c) => (
            <div key={c.metricKey} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{c.metricLabel}</span>
                <div className="font-mono font-black text-slate-900 dark:text-white text-xl mt-0.5">
                  {c.unit ? `${c.unit} ` : ''}{c.currentValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Previous: {c.unit ? `${c.unit} ` : ''}{c.previousValue.toLocaleString()}</div>
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${c.changePct >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'}`}>
                {c.changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{c.changePct >= 0 ? `+${c.changePct}%` : `${c.changePct}%`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Domain Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <DollarSign size={16} className="text-emerald-500" /> Revenue & Financial Intelligence
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{brief.revenuePerformanceSummary}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <CalendarCheck size={16} className="text-blue-500" /> Booking & Operations
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{brief.bookingPerformanceSummary}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Car size={16} className="text-amber-500" /> Fleet Performance
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{brief.fleetPerformanceSummary}</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Users size={16} className="text-purple-500" /> Customer & CRM Intelligence
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{brief.crmPerformanceSummary}</p>
        </div>
      </div>

      {/* Operational Alerts & Financial Issues */}
      {(brief.outstandingFinancialIssues.length > 0 || brief.operationalAlerts.length > 0) && (
        <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertTriangle size={16} /> Operational & Financial Attention Directives
          </div>
          <div className="space-y-1 text-xs text-rose-800 dark:text-rose-300">
            {brief.outstandingFinancialIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>{issue}</span>
              </div>
            ))}
            {brief.operationalAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>{alert}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

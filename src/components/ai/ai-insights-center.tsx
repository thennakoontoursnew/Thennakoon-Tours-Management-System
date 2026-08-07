'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AIInsightItem, InsightPriority } from '@/lib/ai/ai-types'
import { Sparkles, AlertCircle, CheckCircle, XCircle, Filter, ArrowRight } from 'lucide-react'
import { updateInsightStatusAction } from '@/app/(dashboard)/dashboard/ai-tools/ai-actions'

interface AIInsightsCenterProps {
  insights: AIInsightItem[]
}

const PRIORITY_BADGES: Record<InsightPriority, string> = {
  critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  opportunity: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  informational: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
}

export function AIInsightsCenter({ insights }: AIInsightsCenterProps) {
  const router = useRouter()
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = insights.filter((item) => {
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
    return true
  })

  const handleUpdateStatus = async (id: string, status: 'reviewed' | 'dismissed') => {
    setUpdatingId(id)
    try {
      await updateInsightStatusAction(id, status)
      router.refresh()
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Priority Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Insights:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', 'critical', 'high', 'opportunity', 'informational'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border capitalize transition-all ${
                priorityFilter === p
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400 italic">
            No management insights found matching the selected filter.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div key={item.id || idx} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${PRIORITY_BADGES[item.priority]}`}>
                      {item.priority}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{item.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                </div>

                {item.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleUpdateStatus(item.id!, 'reviewed')}
                      disabled={updatingId === item.id}
                      className="p-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle size={14} /> Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id!, 'dismissed')}
                      disabled={updatingId === item.id}
                      className="p-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1"
                    >
                      <XCircle size={14} /> Dismiss
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.summary}</p>

              {/* Evidence Metadata */}
              {item.evidence && item.evidence.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.evidence.map((ev, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      {ev.metric}: <strong>{typeof ev.value === 'number' ? ev.value.toLocaleString() : ev.value} {ev.unit || ''}</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Recommended Action: </strong>
                  {item.recommendation}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

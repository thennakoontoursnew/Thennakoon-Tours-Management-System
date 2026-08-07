'use client'

import { useState } from 'react'
import { RevenueSeriesPoint, RevenueSummary } from '@/lib/dashboard/dashboard-service'
import { TrendingUp, FileText, CheckCircle2, AlertCircle, Percent } from 'lucide-react'

interface RevenueOverviewChartProps {
  initialSeries: RevenueSeriesPoint[]
  initialSummary: RevenueSummary
  onPeriodChange?: (period: string) => void
}

export function RevenueOverviewChart({ initialSeries, initialSummary }: RevenueOverviewChartProps) {
  const [period, setPeriod] = useState('30d')

  const series = initialSeries || []
  const summary = initialSummary || { totalInvoiced: 0, totalCollected: 0, outstanding: 0, collectionRate: 0 }

  // SVG Chart math
  const width = 600
  const height = 180
  const padding = 20

  const maxVal = Math.max(
    ...series.map((s) => Math.max(s.collected, s.invoiced)),
    1000
  )

  const pointsCollected = series.map((s, idx) => {
    const x = padding + (idx / Math.max(series.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - (s.collected / maxVal) * (height - padding * 2)
    return `${x},${y}`
  })

  const pointsInvoiced = series.map((s, idx) => {
    const x = padding + (idx / Math.max(series.length - 1, 1)) * (width - padding * 2)
    const y = height - padding - (s.invoiced / maxVal) * (height - padding * 2)
    return `${x},${y}`
  })

  const areaCollectedPath = pointsCollected.length > 0
    ? `M ${pointsCollected[0]} L ${pointsCollected.join(' L ')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`
    : ''

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Revenue Overview</h2>
            <p className="text-[11px] text-slate-400">Invoiced vs Collected financial trend</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold">
          {['7d', '30d', '3m', '6m', 'ytd'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-lg transition-all uppercase cursor-pointer ${
                period === p
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced</span>
          <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
            LKR {summary.totalInvoiced.toLocaleString()}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-emerald-500">Collected Revenue</span>
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
            LKR {summary.totalCollected.toLocaleString()}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-rose-400">Outstanding</span>
          <p className="text-sm font-black text-rose-500 dark:text-rose-400 font-mono">
            LKR {summary.outstanding.toLocaleString()}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-amber-500">Collection Rate</span>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
            {summary.collectionRate}%
          </p>
        </div>
      </div>

      {/* SVG Trend Chart */}
      {series.length > 0 ? (
        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            {areaCollectedPath && <path d={areaCollectedPath} fill="url(#collectedGradient)" />}

            {/* Line - Invoiced */}
            {pointsInvoiced.length > 1 && (
              <polyline
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                points={pointsInvoiced.join(' ')}
              />
            )}

            {/* Line - Collected */}
            {pointsCollected.length > 1 && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={pointsCollected.join(' ')}
              />
            )}

            {/* Data Dots */}
            {series.map((s, idx) => {
              const x = padding + (idx / Math.max(series.length - 1, 1)) * (width - padding * 2)
              const y = height - padding - (s.collected / maxVal) * (height - padding * 2)
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-emerald-500 stroke-white dark:stroke-slate-900 stroke-2"
                />
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-[11px] font-semibold text-slate-500 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 rounded-full"></span>
              <span>Collected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-400"></span>
              <span>Invoiced</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">No financial transactions recorded in selected period.</div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { FleetStatusItem } from '@/lib/dashboard/dashboard-service'
import { Car, ArrowUpRight } from 'lucide-react'

interface FleetStatusChartProps {
  items: FleetStatusItem[]
  totalFleet: number
}

export function FleetStatusChart({ items, totalFleet }: FleetStatusChartProps) {
  const statusItems = items || []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Fleet Status</h2>
            <p className="text-[11px] text-slate-400">{totalFleet} total vehicles registered</p>
          </div>
        </div>
        <Link
          href="/dashboard/vehicles"
          className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
        >
          <span>Fleet Roster</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Progress Multi-Bar Breakdown */}
      <div className="space-y-3">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {statusItems.map((item) => {
            const widthPct = totalFleet > 0 ? (item.count / totalFleet) * 100 : 0
            if (widthPct === 0) return null
            const colorClass = item.color.split(' ')[0]
            return (
              <div
                key={item.status}
                style={{ width: `${widthPct}%` }}
                className={`${colorClass} h-full transition-all`}
                title={`${item.label}: ${item.count} (${Math.round(widthPct)}%)`}
              />
            )
          })}
        </div>

        {/* Category List */}
        <div className="space-y-2 pt-2">
          {statusItems.map((item) => {
            const colorDot = item.color.split(' ')[0]
            return (
              <Link
                key={item.status}
                href={`/dashboard/vehicles?status=${item.status}`}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-xs font-semibold group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorDot}`} />
                  <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{item.count}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({totalFleet > 0 ? Math.round((item.count / totalFleet) * 100) : 0}%)
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Summary Footnote */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click category to filter vehicles</span>
        <Car size={14} className="text-amber-500" />
      </div>
    </div>
  )
}

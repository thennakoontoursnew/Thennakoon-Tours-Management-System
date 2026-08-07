'use client'

import { DashboardActivity } from '@/lib/dashboard/dashboard-service'
import { Activity, Clock, User, FileText, ScrollText, FileSpreadsheet, WalletCards } from 'lucide-react'

interface RecentActivityTimelineProps {
  activities: DashboardActivity[]
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'recently'
  const past = new Date(dateStr).getTime()
  const now = new Date().getTime()
  const diffMs = Math.max(now - past, 0)
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  const activityList = activities || []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Activity</h2>
            <p className="text-[11px] text-slate-400">Audit log stream & system events</p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
          <Activity size={18} />
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="space-y-3">
        {activityList.length > 0 ? (
          activityList.map((act) => (
            <div key={act.id} className="flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700/60">
                <Clock size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white leading-tight">
                  {act.change_summary}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{act.user_name}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(act.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No activity logs recorded yet.</div>
        )}
      </div>
    </div>
  )
}

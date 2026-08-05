'use client'

import { Activity, Car, FileText, DollarSign, CheckCircle2, User, Clock, AlertCircle } from 'lucide-react'

interface ActivityLogDTO {
  id: string
  action?: string | null
  change_summary?: string | null
  previous_status?: string | null
  new_status?: string | null
  created_at: string
  user_name?: string | null
}

interface ActivityTimelineProps {
  logs: ActivityLogDTO[]
  bookingCreatedAt: string
}

function formatColomboDateTime(isoStr: string): string {
  if (!isoStr) return 'N/A'
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('en-GB', {
      timeZone: 'Asia/Colombo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'N/A'
  }
}

function getIconForAction(action?: string | null) {
  const act = (action || '').toUpperCase()
  if (act.includes('DRIVER')) return <Car size={14} className="text-amber-500" />
  if (act.includes('AGREEMENT')) return <FileText size={14} className="text-emerald-500" />
  if (act.includes('INVOICE') || act.includes('PAYMENT') || act.includes('RECEIPT')) return <DollarSign size={14} className="text-blue-500" />
  if (act.includes('STATUS')) return <CheckCircle2 size={14} className="text-purple-500" />
  return <Activity size={14} className="text-slate-400" />
}

export default function ActivityTimeline({ logs, bookingCreatedAt }: ActivityTimelineProps) {
  const allEntries: ActivityLogDTO[] = [...logs]

  // Add initial booking creation event if logs don't include it
  if (allEntries.length === 0) {
    allEntries.push({
      id: 'init-created',
      action: 'CREATE_BOOKING',
      change_summary: 'Booking created',
      created_at: bookingCreatedAt,
      user_name: 'System User',
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
        <Clock size={15} />
        <span>Activity & Audit Timeline</span>
      </h2>

      {allEntries.length > 0 ? (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {allEntries.map((log) => (
            <div key={log.id} className="relative flex items-start justify-between gap-4 group">
              {/* Timeline Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                {getIconForAction(log.action)}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{log.change_summary || log.action || 'Activity Event'}</span>
                  {log.previous_status && log.new_status && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {log.previous_status} &rarr; {log.new_status}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    <span>{log.user_name || 'System User'}</span>
                  </span>
                  <span>&bull;</span>
                  <span className="uppercase text-[10px] font-mono tracking-wider">{log.action || 'EVENT'}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="text-[11px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                {formatColomboDateTime(log.created_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic flex items-center gap-1.5 py-2">
          <AlertCircle size={14} />
          <span>No activity recorded yet.</span>
        </div>
      )}
    </div>
  )
}

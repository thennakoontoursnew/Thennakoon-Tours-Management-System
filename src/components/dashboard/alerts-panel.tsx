'use client'

import Link from 'next/link'
import { DashboardAlert } from '@/lib/dashboard/dashboard-service'
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle2, ArrowRight } from 'lucide-react'

interface AlertsPanelProps {
  alerts: DashboardAlert[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const alertList = alerts || []

  const renderIcon = (priority: 'critical' | 'warning' | 'info') => {
    if (priority === 'critical') return <AlertTriangle size={16} className="text-rose-500 shrink-0" />
    if (priority === 'warning') return <AlertCircle size={16} className="text-amber-500 shrink-0" />
    return <Info size={16} className="text-blue-500 shrink-0" />
  }

  const renderBadge = (priority: 'critical' | 'warning' | 'info') => {
    if (priority === 'critical')
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">CRITICAL</span>
    if (priority === 'warning')
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">WARNING</span>
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase">INFO</span>
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Alerts & Reminders</h2>
            <p className="text-[11px] text-slate-400">Items requiring operational attention</p>
          </div>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
          <Bell size={18} />
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2.5">
        {alertList.length > 0 ? (
          alertList.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                alert.priority === 'critical'
                  ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20'
                  : alert.priority === 'warning'
                  ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {renderIcon(alert.priority)}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {renderBadge(alert.priority)}
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{alert.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{alert.description}</p>
                </div>
              </div>

              {alert.bookingId && (
                <Link
                  href={`/dashboard/bookings/${alert.bookingId}`}
                  className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-amber-300 transition-all shrink-0 self-center"
                >
                  Manage
                </Link>
              )}
              {alert.invoiceId && (
                <Link
                  href={`/dashboard/invoices/${alert.invoiceId}`}
                  className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] hover:bg-amber-300 transition-all shrink-0 self-center"
                >
                  View Invoice
                </Link>
              )}
            </div>
          ))
        ) : (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={24} className="text-emerald-500 mx-auto opacity-80" />
            <p className="text-xs text-slate-400">All operations normal. No active alerts.</p>
          </div>
        )}
      </div>
    </div>
  )
}

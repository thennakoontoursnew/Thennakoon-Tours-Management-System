'use client'

import { BookingStatus, STATUS_LABELS } from '@/lib/bookings/booking-workflow'
import { Check, Clock, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'

interface BookingLifecycleProgressProps {
  status: BookingStatus
}

export function BookingLifecycleProgress({ status }: BookingLifecycleProgressProps) {
  const isTerminal = ['cancelled', 'no_show'].includes(status)

  if (isTerminal) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <XCircle size={20} className="text-rose-500 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Terminal Booking Status: {STATUS_LABELS[status]}
            </h3>
            <p className="text-[11px] text-rose-600 dark:text-rose-300">
              Operational lifecycle terminated. Allocated vehicle and driver have been released safely.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const steps: { key: BookingStatus; label: string }[] = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'ready', label: 'Vehicle Ready' },
    { key: 'on_trip', label: 'On Trip' },
    { key: 'returned', label: 'Returned' },
    { key: 'completed', label: 'Completed' },
    { key: 'closed', label: 'Closed' },
  ]

  const statusOrder: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    ready: 2,
    in_progress: 3,
    on_trip: 3,
    returned: 4,
    completed: 5,
    closed: 6,
  }

  const currentLevel = statusOrder[status] || 1

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Booking Lifecycle Progress
        </span>
        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
          Current State: {STATUS_LABELS[status] || status}
        </span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Progress Bar Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-amber-400 transition-all duration-500 z-0"
          style={{ width: `${Math.min(((currentLevel - 1) / (steps.length - 1)) * 100, 100)}%` }}
        />

        {/* Steps */}
        {steps.map((step, idx) => {
          const stepLevel = idx + 1
          const isDone = currentLevel > stepLevel
          const isCurrent = currentLevel === stepLevel

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5 group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                  isDone
                    ? 'bg-amber-400 text-slate-950 border border-amber-300'
                    : isCurrent
                    ? 'bg-slate-900 text-amber-400 border-2 border-amber-400 dark:bg-slate-950 ring-4 ring-amber-400/20'
                    : 'bg-white dark:bg-slate-850 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isDone ? <Check size={14} /> : stepLevel}
              </div>
              <span
                className={`text-[10px] font-semibold tracking-tight whitespace-nowrap ${
                  isCurrent
                    ? 'text-amber-500 font-bold'
                    : isDone
                    ? 'text-slate-800 dark:text-slate-200 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

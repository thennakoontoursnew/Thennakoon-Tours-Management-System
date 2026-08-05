'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function BookingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Booking Detail Route Error Boundary Caught:', error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4 text-center">
      <AlertCircle size={40} className="mx-auto text-rose-500" />
      <h2 className="text-base font-bold text-slate-900 dark:text-white">Unable to Load Booking Details</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        An error occurred while loading this booking. The record may be temporarily unavailable or incomplete.
      </p>
      {error.message && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono text-left overflow-x-auto max-h-32">
          {error.message}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          href="/dashboard/bookings"
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Bookings</span>
        </Link>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Reload Page</span>
        </button>
      </div>
    </div>
  )
}

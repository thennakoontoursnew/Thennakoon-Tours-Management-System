'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function UserAgreementPreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[USER AGREEMENT PREVIEW BOUNDARY ERROR]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 text-center">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 w-fit mx-auto">
          <AlertTriangle size={28} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Unable to Load User Agreement</h2>
          <p className="text-xs text-slate-400 mt-1">
            An unexpected error occurred while preparing the agreement preview document.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[10px] text-slate-400">
            <span className="text-slate-500 block font-bold">Error Reference Digest:</span>
            <span className="text-rose-400">{error.digest}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard/agreements"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Agreements Center</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

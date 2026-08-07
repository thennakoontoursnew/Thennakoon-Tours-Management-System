'use client'

import { useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'

interface BookingCloseModalProps {
  isOpen: boolean
  balanceDue: number
  isOwner: boolean
  onClose: () => void
  onSubmit: (overrideReason?: string) => Promise<void>
}

export function BookingCloseModal({
  isOpen,
  balanceDue,
  isOwner,
  onClose,
  onSubmit,
}: BookingCloseModalProps) {
  const [loading, setLoading] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  if (!isOpen) return null

  const hasUnpaidBalance = balanceDue > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasUnpaidBalance && !isOwner) {
      alert(`Cannot close booking with unpaid balance (LKR ${balanceDue.toLocaleString()}). Owner override required.`)
      return
    }

    if (hasUnpaidBalance && isOwner && !overrideReason.trim()) {
      alert('Please enter an owner override reason to close a booking with an outstanding balance.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(overrideReason)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Close Booking</h2>
              <p className="text-[11px] text-slate-400">Finalize booking record and archive lifecycle</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {hasUnpaidBalance ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Unpaid Invoice Balance</span>
                <span className="font-mono text-sm">LKR {balanceDue.toLocaleString()}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This booking has an outstanding financial balance. Standard staff cannot close un-settled bookings.
              </p>
              {!isOwner && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-[11px]">
                  ⚠️ Access Restricted: Only system Owner can override and close un-settled bookings.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              ✓ All invoices and payments are fully settled. Booking is ready for final closure.
            </div>
          )}

          {hasUnpaidBalance && isOwner && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Owner Override Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this booking is being closed with an unpaid balance..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
                required
              />
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (hasUnpaidBalance && !isOwner)}
              className={`px-5 py-2 font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer ${
                hasUnpaidBalance && !isOwner
                  ? 'bg-slate-300 text-slate-500 dark:bg-slate-800 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {loading ? 'Closing...' : 'Confirm Close Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

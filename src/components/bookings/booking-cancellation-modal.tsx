'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface BookingCancellationModalProps {
  isOpen: boolean
  isNoShow?: boolean
  onClose: () => void
  onSubmit: (reason: string, notes: string) => Promise<void>
}

export function BookingCancellationModal({
  isOpen,
  isNoShow = false,
  onClose,
  onSubmit,
}: BookingCancellationModalProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('Customer Request')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const reasonsList = isNoShow
    ? ['Hirer Did Not Arrive', 'Unreachable via Mobile/WhatsApp', 'Late Cancellation', 'Other']
    : [
        'Customer Request',
        'Payment Not Received',
        'Vehicle Unavailable',
        'Driver Unavailable',
        'Duplicate Booking',
        'Operational Issue',
        'Other',
      ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalReason = reason === 'Other' ? customReason : reason
    if (!finalReason.trim()) {
      alert('Please specify a reason.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(finalReason, notes)
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
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                {isNoShow ? 'Record No Show' : 'Cancel Booking'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isNoShow ? 'Mark hirer as no-show and release resources' : 'Terminate booking lifecycle'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Reason for {isNoShow ? 'No Show' : 'Cancellation'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
            >
              {reasonsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Specify Reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Additional Staff Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details, customer communication, or deposit refund instructions..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Automatic Side Effects:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Allocated vehicle and driver will be released immediately.</li>
              <li>Linked agreements, invoices, and payments remain preserved in history.</li>
              <li>Cancellation event will be written to audit logs.</li>
            </ul>
          </div>

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
              disabled={loading}
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Processing...' : isNoShow ? 'Confirm No Show' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { convertQuotationToBooking } from '../quotation-actions'

interface ConvertBookingButtonProps {
  quotationId: string
  quotationNumber: string
}

export function ConvertBookingButton({ quotationId, quotationNumber }: ConvertBookingButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (loading) return
    try {
      setLoading(true)
      setError(null)
      const res = await convertQuotationToBooking(quotationId)

      if (res.success && res.bookingId) {
        setShowModal(false)
        router.push(`/dashboard/bookings/${res.bookingId}`)
      } else {
        setError(res.error || 'Booking conversion failed. No partial booking was created.')
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error during conversion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          setShowModal(true)
        }}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <ArrowRightLeft size={15} />
        <span>Convert to Booking</span>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Confirm Booking Conversion</span>
              </div>
              <button
                onClick={() => !loading && setShowModal(false)}
                disabled={loading}
                className="text-slate-400 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to convert Quotation <strong className="text-slate-900 dark:text-white font-mono">{quotationNumber}</strong> into a confirmed Booking?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <span>Confirm & Convert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

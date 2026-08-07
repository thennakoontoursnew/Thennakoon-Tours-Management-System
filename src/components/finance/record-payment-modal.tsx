'use client'

import { useState } from 'react'
import { DollarSign, X } from 'lucide-react'

interface RecordPaymentModalProps {
  isOpen: boolean
  invoiceId: string
  invoiceNumber: string
  balanceDue: number
  onClose: () => void
  onSubmit: (paymentData: {
    amount: number
    payment_method: string
    reference_number?: string
    notes?: string
  }) => Promise<void>
}

export function RecordPaymentModal({
  isOpen,
  invoiceId,
  invoiceNumber,
  balanceDue,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(balanceDue.toString())
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) return

    if (numAmount > balanceDue) {
      alert(`Payment amount (LKR ${numAmount.toLocaleString()}) exceeds current balance due (LKR ${balanceDue.toLocaleString()}).`)
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        amount: numAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Record Payment — {invoiceNumber}</h2>
              <p className="text-[11px] text-slate-400">Balance Due: LKR {balanceDue.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Payment Amount (LKR) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              step="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Payment Method <span className="text-rose-500">*</span></label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="bank_transfer">Bank Transfer (Deposit)</option>
                <option value="cash">Cash</option>
                <option value="card">Credit / Debit Card</option>
                <option value="online">Online Payment</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Ref / Slip Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TRF-99881122"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record payment details or bank branch..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Recording...' : 'Record Payment & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

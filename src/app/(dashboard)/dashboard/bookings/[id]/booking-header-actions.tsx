'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  DollarSign,
  Printer,
  MessageCircle,
  Archive,
  CheckCircle2,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Edit3,
  RefreshCw,
} from 'lucide-react'
import { updateBookingStatus, archiveBookingAction } from '../booking-actions'
import { createInvoiceFromBooking } from '../../invoices/invoice-actions'
import { createAgreementFromBooking } from '../../agreements/agreement-actions'

interface BookingHeaderActionsProps {
  bookingId: string
  bookingNumber: string
  currentStatus: string
  customerName: string
  customerPhone?: string | null
  rentalStart: string
  rentalEnd: string
  vehicleName: string
  grandTotal: number
  existingInvoiceId?: string | null
  existingInvoiceNumber?: string | null
  existingAgreementId?: string | null
  existingAgreementNumber?: string | null
}

function normalizeSriLankanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('94')) return digits
  if (digits.startsWith('0')) return '94' + digits.slice(1)
  if (digits.length === 9 && digits.startsWith('7')) return '94' + digits
  return digits
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'on_trip', 'completed', 'cancelled', 'no_show'],
  in_progress: ['completed', 'cancelled'],
  on_trip: ['completed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
  no_show: [],
}

export default function BookingHeaderActions({
  bookingId,
  bookingNumber,
  currentStatus,
  customerName,
  customerPhone,
  rentalStart,
  rentalEnd,
  vehicleName,
  grandTotal,
  existingInvoiceId,
  existingInvoiceNumber,
  existingAgreementId,
  existingAgreementNumber,
}: BookingHeaderActionsProps) {
  const router = useRouter()
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('')
  const [isEditingInvoiceNo, setIsEditingInvoiceNo] = useState(false)

  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []

  const handleStatusChange = async () => {
    if (!pendingStatus) return
    try {
      setLoadingAction('STATUS')
      setErrorMessage(null)
      const res = await updateBookingStatus(bookingId, pendingStatus, statusReason)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update status.')
        return
      }
      setPendingStatus(null)
      setStatusReason('')
      setIsStatusMenuOpen(false)
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating status.')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmInvoice = async () => {
    if (loadingAction) return
    try {
      setLoadingAction('INVOICE')
      setErrorMessage(null)

      const inputNumber = isEditingInvoiceNo ? customInvoiceNumber.trim().toUpperCase() : undefined
      const res = await createInvoiceFromBooking(bookingId, inputNumber)

      if (!res.success || !res.invoiceId) {
        setErrorMessage((res as any).error || 'Invoice Generation Failed.')
        return
      }

      setShowInvoiceModal(false)
      if ((res as any).existing) {
        alert(`An active Invoice already exists (${(res as any).invoiceNumber || 'INV'}). Redirecting to existing invoice.`)
      }
      router.push(`/dashboard/invoices/${res.invoiceId}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'Invoice Exception')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateAgreement = async () => {
    if (loadingAction) return
    if (!window.confirm('Generate official rental agreement for this booking?')) return
    try {
      setLoadingAction('AGREEMENT')
      const res = await createAgreementFromBooking(bookingId)

      if (!res.success || !res.agreementId) {
        alert(`Agreement Generation Failed: ${res.error || 'Unknown error'}`)
        return
      }

      if (res.existing) {
        alert(`An active Rental Agreement already exists (${res.agreementNumber || 'AGR'}). Redirecting to the existing agreement.`)
      }

      router.push(`/dashboard/agreements/${res.agreementId}/preview`)
    } catch (err: any) {
      alert(`Agreement Exception: ${err.message}`)
    } finally {
      setLoadingAction(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    const rawPhone = customerPhone || ''
    const phone = normalizeSriLankanPhone(rawPhone)
    const msg = `Hello ${customerName},\n\nYour booking ${bookingNumber} is confirmed.\n\nRental Dates:\n${rentalStart} to ${rentalEnd}\n\nVehicle:\n${vehicleName}\n\nTotal:\nLKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nThank you,\nThennakoon Tours`

    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`

    window.open(url, '_blank')
  }

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this booking?')) return
    try {
      setLoadingAction('ARCHIVE')
      const res = await archiveBookingAction(bookingId)
      if (!res.success) {
        alert(`Archive Failed: ${res.error}`)
        return
      }
      router.push('/dashboard/bookings')
    } catch (err: any) {
      alert(`Archive Exception: ${err.message}`)
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status Control Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
          disabled={allowedTransitions.length === 0}
          className="px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <span>Status: {currentStatus.toUpperCase()}</span>
          {allowedTransitions.length > 0 && <ChevronDown size={14} />}
        </button>

        {isStatusMenuOpen && allowedTransitions.length > 0 && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-1 space-y-1">
            {allowedTransitions.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setPendingStatus(st)
                  setIsStatusMenuOpen(false)
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 capitalize transition-colors"
              >
                Change to {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Action Button */}
      {existingInvoiceId ? (
        <Link
          href={`/dashboard/invoices/${existingInvoiceId}`}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <CheckCircle2 size={14} />
          <span>View Invoice ({existingInvoiceNumber || 'INV'})</span>
        </Link>
      ) : (
        <button
          onClick={() => {
            setErrorMessage(null)
            setShowInvoiceModal(true)
          }}
          disabled={loadingAction === 'INVOICE'}
          className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          {loadingAction === 'INVOICE' ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
          <span>Generate Invoice</span>
        </button>
      )}

      {/* Rental Agreement Action Button */}
      {existingAgreementId ? (
        <Link
          href={`/dashboard/agreements/${existingAgreementId}/preview`}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <CheckCircle2 size={14} />
          <span>View Agreement ({existingAgreementNumber || 'AGR'})</span>
        </Link>
      ) : (
        <button
          onClick={handleGenerateAgreement}
          disabled={loadingAction === 'AGREEMENT'}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loadingAction === 'AGREEMENT' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          <span>Generate Agreement</span>
        </button>
      )}

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-xs"
        title="Print Booking"
      >
        <Printer size={15} />
      </button>

      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsApp}
        className="p-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-400 cursor-pointer shadow-xs flex items-center gap-1"
        title="WhatsApp Customer"
      >
        <MessageCircle size={15} />
      </button>

      {/* Archive Button */}
      <button
        onClick={handleArchive}
        disabled={loadingAction === 'ARCHIVE'}
        className="p-2 bg-slate-100 dark:bg-slate-800 text-rose-500 rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-bold hover:bg-rose-500/10 cursor-pointer shadow-xs"
        title="Archive Booking"
      >
        <Archive size={15} />
      </button>

      {/* Generate Invoice Modal with Editable Numbering */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <DollarSign size={20} className="text-amber-400" />
              <h3 className="text-sm font-bold">Generate Official Invoice</h3>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create an official invoice for booking <strong>{bookingNumber}</strong> ({customerName}).
            </p>

            {/* Responsive Non-Overlapping Input & Edit Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Invoice Number <span className="text-rose-500">*</span>
                </label>
                {isEditingInvoiceNo ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Manual Number
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Auto Generated
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={isEditingInvoiceNo ? customInvoiceNumber : 'TT-IN-10001'}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value.toUpperCase().trim())}
                    readOnly={!isEditingInvoiceNo}
                    placeholder="TT-IN-10001"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                      isEditingInvoiceNo
                        ? 'bg-white dark:bg-slate-900 border-amber-400 focus:outline-none ring-2 ring-amber-400/20 text-slate-900 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditingInvoiceNo) {
                      setIsEditingInvoiceNo(false)
                      setCustomInvoiceNumber('')
                    } else {
                      setIsEditingInvoiceNo(true)
                      setCustomInvoiceNumber('TT-IN-10001')
                    }
                  }}
                  className="shrink-0 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isEditingInvoiceNo ? (
                    <>
                      <RefreshCw size={13} />
                      <span>Use Auto Number</span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              {isEditingInvoiceNo && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  You may change this number before saving. Duplicate invoice numbers are not allowed. Must start with <strong className="font-mono text-amber-500">TT-IN-</strong>.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setErrorMessage(null)
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInvoice}
                disabled={loadingAction === 'INVOICE'}
                className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-300 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'INVOICE' && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm & Create Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Confirm Status Transition to &quot;{pendingStatus.toUpperCase()}&quot;
              </h3>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to change booking status from <strong>{currentStatus.toUpperCase()}</strong> to <strong>{pendingStatus.toUpperCase()}</strong>?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Remarks (Optional)
              </label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status change..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-amber-400 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setPendingStatus(null)
                  setErrorMessage(null)
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={loadingAction === 'STATUS'}
                className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-300 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'STATUS' && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Status Change</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

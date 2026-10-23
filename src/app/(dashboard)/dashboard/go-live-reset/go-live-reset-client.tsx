'use client'

import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  Download,
  CheckCircle2,
  Lock,
  Loader2,
  Trash2,
  RefreshCw,
  X,
  Database,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react'
import { exportTestDataCSV, executeGoLiveResetAction } from './go-live-reset-actions'

interface Props {
  summary: any
}

export function GoLiveResetClient({ summary: initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary)
  const [understandChecked, setUnderstandChecked] = useState(false)
  const [reason, setReason] = useState('Clearing test data during testing phase.')
  const [confirmationInput, setConfirmationInput] = useState('')
  const [deleteCategories, setDeleteCategories] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exportingEntity, setExportingEntity] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isLocked = summary?.settings?.goLiveCompleted
  const counts = summary?.counts || {}
  const expected = summary?.expectedNextNumbers || {}

  const totalTransactionalRecordsCount =
    (counts.quotations || 0) +
    (counts.bookings || 0) +
    (counts.invoices || 0) +
    (counts.payments || 0) +
    (counts.receipts || 0) +
    (counts.rentalAgreements || 0) +
    (counts.expenses || 0) +
    (counts.leads || 0) +
    (counts.documentActivityLogs || 0)

  const trimmedConfirm = confirmationInput.trim()
  const isValidForReset =
    understandChecked &&
    (trimmedConfirm === 'RESET TEST DATA' || trimmedConfirm === 'GO LIVE RESET') &&
    reason.trim().length > 0

  const handleExportCSV = async (entity: 'customers' | 'vehicles' | 'drivers' | 'quotations') => {
    try {
      setExportingEntity(entity)
      const res = await exportTestDataCSV(entity)
      if (res.success && res.csvContent) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', res.filename || `${entity}-backup.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(res.error || 'Failed to export CSV.')
      }
    } catch (err: any) {
      alert(err.message || 'Error exporting CSV backup.')
    } finally {
      setExportingEntity(null)
    }
  }

  const handleExecuteReset = async () => {
    if (!isValidForReset || isSubmitting) return

    try {
      setIsSubmitting(true)
      setFeedback(null)

      const res = await executeGoLiveResetAction({
        confirmation: trimmedConfirm,
        reason: reason.trim(),
        deleteCategories,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Test data cleared successfully! All transactional records wiped and sequence counters reset.',
        })
        setShowModal(false)
        setConfirmationInput('')
        setUnderstandChecked(false)
        setSummary((prev: any) => ({
          ...prev,
          counts: {
            ...prev.counts,
            quotations: 0,
            quotationItems: 0,
            bookings: 0,
            bookingVehicles: 0,
            invoices: 0,
            invoiceItems: 0,
            payments: 0,
            receipts: 0,
            rentalAgreements: 0,
            expenses: 0,
            leads: 0,
            documentActivityLogs: 0,
          },
        }))
      } else {
        setFeedback({ type: 'error', message: res.error || 'Execution failed.' })
        setShowModal(false)
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unexpected error.' })
      setShowModal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <RotateCcw size={26} className="text-rose-500" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Reset Testing Data & Sequence Counters
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Owner-only controlled action to wipe all transactional test records (Quotations, Invoices, Agreements, Bookings, Receipts, Payments, Expenses, and Leads) while preserving master fleet and company records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Role: System Owner
          </span>
        </div>
      </div>

      {/* Testing Mode Banner */}
      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-900 dark:text-slate-100 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle size={18} />
          <span>ACTIVE TESTING PHASE — REPEATABLE TESTING RESET</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          This action wipes all dummy transactional records created during testing and restarts numbering counters (e.g., <code className="font-mono font-bold text-slate-800 dark:text-slate-200">QT-{new Date().getFullYear()}-000001</code>, <code className="font-mono font-bold text-slate-800 dark:text-slate-200">INV-{new Date().getFullYear()}-000001</code>). Master records including <strong>Company Settings, User Profiles, Fleet Vehicles, Drivers, and Document Templates</strong> are 100% preserved.
        </p>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Grid 1: Live Record Counts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Database size={16} />
            <span>Transactional Test Data ({totalTransactionalRecordsCount} total records to wipe)</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: 'Quotations', count: counts.quotations || 0, isTransactional: true },
            { label: 'Bookings', count: counts.bookings || 0, isTransactional: true },
            { label: 'Rental Agreements', count: counts.rentalAgreements || 0, isTransactional: true },
            { label: 'Invoices', count: counts.invoices || 0, isTransactional: true },
            { label: 'Payments', count: counts.payments || 0, isTransactional: true },
            { label: 'Receipts', count: counts.receipts || 0, isTransactional: true },
            { label: 'Expenses & Statements', count: counts.expenses || 0, isTransactional: true },
            { label: 'Leads & Inquiries', count: counts.leads || 0, isTransactional: true },
            { label: 'Vehicles (Preserved)', count: counts.vehicles || 0, isTransactional: false },
            { label: 'Drivers (Preserved)', count: counts.drivers || 0, isTransactional: false },
            { label: 'Customers (CRM)', count: counts.customers || 0, isTransactional: false },
            { label: 'Activity Logs', count: counts.documentActivityLogs || 0, isTransactional: true },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border space-y-1 shadow-xs ${
                item.isTransactional
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                {!item.isTransactional && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Kept
                  </span>
                )}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">{item.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid 2: Expected First Production Numbering */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <RefreshCw size={16} />
          <span>Expected Next Numbers After Reset</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Next Quotation #', val: expected.quotationNumber },
            { label: 'Next Booking #', val: expected.bookingNumber },
            { label: 'Next Invoice #', val: expected.invoiceNumber },
            { label: 'Next Receipt #', val: expected.receiptNumber },
            { label: 'Next Agreement #', val: expected.agreementNumber },
            { label: 'Customer Code', val: expected.customerCode },
            { label: 'Vehicle Code', val: expected.vehicleCode },
            { label: 'Driver Code', val: expected.driverCode },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-900 dark:text-slate-100 space-y-0.5"
            >
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{item.label}</p>
              <p className="text-sm font-black font-mono">{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Optional Test Data Backups */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-blue-500" />
              <span>Download Optional Test Data Backup (CSV)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export records to CSV before executing the reset if required for reference.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {(['customers', 'vehicles', 'drivers', 'quotations'] as const).map((ent) => (
            <button
              key={ent}
              onClick={() => handleExportCSV(ent)}
              disabled={exportingEntity === ent}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {exportingEntity === ent ? (
                <Loader2 size={14} className="animate-spin text-blue-500" />
              ) : (
                <Download size={14} />
              )}
              <span className="capitalize">Download {ent} CSV</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 4: Owner Confirmation & Reset Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 shadow-xl space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Lock size={18} />
            <span>Owner Confirmation Form</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirm wiping test operational data and resetting sequence numbers.
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={understandChecked}
              onChange={(e) => setUnderstandChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              I confirm wiping all transactional test records ({totalTransactionalRecordsCount} records) and resetting sequence numbering to 000001. Master records (vehicles, drivers, company info) will remain intact.
            </span>
          </label>

          {/* Step 2: Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason for Reset:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Clearing test data during testing phase."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Step 3: Confirmation Phrase */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">RESET TEST DATA</span> exactly:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="RESET TEST DATA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowModal(true)}
            disabled={!isValidForReset}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              isValidForReset
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={16} />
            <span>Review & Wipe Test Data</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog for Final Confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
                <AlertTriangle size={20} />
                <span>Confirm Test Data Wipe</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                You are about to wipe transactional test data for <strong className="text-amber-500">Thennakoon Tours</strong>.
              </p>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 space-y-1 font-mono text-[11px]">
                <p>• Test Records To Clear: <strong className="text-rose-500">{totalTransactionalRecordsCount}</strong></p>
                <p>• Sequences To Restart: <strong className="text-emerald-500">Number Counters</strong></p>
                <p>• Master Records: <strong className="text-emerald-500">Vehicles, Drivers, Company Settings Kept</strong></p>
              </div>

              <p className="text-rose-500 font-semibold">
                Are you sure you want to proceed with clearing all transactional test records?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Wiping Data...</span>
                  </>
                ) : (
                  <span>Yes, Wipe Test Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

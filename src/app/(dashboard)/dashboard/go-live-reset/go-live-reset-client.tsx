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
} from 'lucide-react'
import { exportTestDataCSV, executeGoLiveResetAction } from './go-live-reset-actions'

interface Props {
  summary: any
}

export function GoLiveResetClient({ summary: initialSummary }: Props) {
  const [summary, setSummary] = useState(initialSummary)
  const [understandChecked, setUnderstandChecked] = useState(false)
  const [reason, setReason] = useState('Preparing system for production use.')
  const [confirmationInput, setConfirmationInput] = useState('')
  const [deleteCategories, setDeleteCategories] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exportingEntity, setExportingEntity] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isLocked = summary?.settings?.goLiveCompleted
  const counts = summary?.counts || {}
  const expected = summary?.expectedNextNumbers || {}

  const totalRecordsCount =
    counts.customers +
    counts.vehicles +
    counts.drivers +
    counts.quotations +
    counts.bookings +
    counts.invoices +
    counts.receipts +
    counts.rentalAgreements +
    counts.documentActivityLogs

  const isValidForReset =
    !isLocked && understandChecked && confirmationInput.trim() === 'GO LIVE RESET' && reason.trim().length > 0

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
        confirmation: confirmationInput.trim(),
        reason: reason.trim(),
        deleteCategories,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Go Live Reset completed successfully! All test data removed and sequence numbering restarted.',
        })
        setShowModal(false)
        setSummary((prev: any) => ({
          ...prev,
          settings: {
            ...prev.settings,
            goLiveCompleted: true,
            goLiveAt: new Date().toISOString(),
          },
          counts: {
            customers: 0,
            vehicles: 0,
            drivers: 0,
            quotations: 0,
            quotationItems: 0,
            bookings: 0,
            bookingVehicles: 0,
            invoices: 0,
            invoiceItems: 0,
            payments: 0,
            receipts: 0,
            rentalAgreements: 0,
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
            <ShieldAlert size={26} className="text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Go Live Production Initialization
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Owner-only controlled action to clear test operational data and start production numbering from 000001.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Role: System Owner
          </span>
        </div>
      </div>

      {/* Lockout Banner if Go Live is completed */}
      {isLocked && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-base text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={22} />
            <span>System is LIVE in Production!</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Go Live Reset was completed on {summary.settings.goLiveAt ? new Date(summary.settings.goLiveAt).toLocaleString() : 'Record'}. Production numbering is active (`CUS-000001`, `VEH-000001`, `QT-2026-000001`, etc.). Further resets are permanently locked.
          </p>
        </div>
      )}

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
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Strong Warning Banner */}
      {!isLocked && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-900 dark:text-slate-100 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-600 dark:text-rose-400">
            <AlertTriangle size={18} />
            <span>CRITICAL PRODUCTION INITIALIZATION WARNING</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This action permanently removes all test business records and resets sequence numbering to 000001. User accounts, user roles, company settings, document templates, official letterhead assets, and security policies will be strictly preserved.
          </p>
        </div>
      )}

      {/* Grid 1: Live Record Counts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Database size={16} />
            <span>Test Operational Data Counts ({totalRecordsCount} total records)</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: 'Customers', count: counts.customers },
            { label: 'Vehicles', count: counts.vehicles },
            { label: 'Drivers', count: counts.drivers },
            { label: 'Quotations', count: counts.quotations },
            { label: 'Quotation Items', count: counts.quotationItems },
            { label: 'Bookings', count: counts.bookings },
            { label: 'Booking Vehicles', count: counts.bookingVehicles },
            { label: 'Invoices', count: counts.invoices },
            { label: 'Invoice Items', count: counts.invoiceItems },
            { label: 'Payments', count: counts.payments },
            { label: 'Receipts', count: counts.receipts },
            { label: 'Rental Agreements', count: counts.rentalAgreements },
            { label: 'Document Activity Logs', count: counts.documentActivityLogs },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm"
            >
              <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{item.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid 2: Expected First Production Numbering */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <RefreshCw size={16} />
          <span>Expected First Production Numbers After Reset</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'First Customer Code', val: expected.customerCode },
            { label: 'First Vehicle Code', val: expected.vehicleCode },
            { label: 'First Driver Code', val: expected.driverCode },
            { label: 'First Quotation #', val: expected.quotationNumber },
            { label: 'First Booking #', val: expected.bookingNumber },
            { label: 'First Invoice #', val: expected.invoiceNumber },
            { label: 'First Receipt #', val: expected.receiptNumber },
            { label: 'First Agreement #', val: expected.agreementNumber },
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
              Export test records to CSV before executing the reset if required for reference.
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
      {!isLocked && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/30 shadow-xl space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Lock size={18} />
              <span>Multi-Factor Confirmation Form</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete all required safety inputs to unlock the Go Live Reset button.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1: Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={understandChecked}
                onChange={(e) => setUnderstandChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                I understand this permanently deletes all test operational data ({totalRecordsCount} records) and resets production sequence numbering.
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
                placeholder="e.g. Preparing system for production use."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Step 3: Confirmation Phrase */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">GO LIVE RESET</span> exactly:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="GO LIVE RESET"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Step 4: Optional Category Checkbox */}
            <label className="flex items-center gap-2.5 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteCategories}
                onChange={(e) => setDeleteCategories(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Also remove custom vehicle categories (Default: keep master categories)
              </span>
            </label>
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
              <span>Review & Execute Go Live Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog for Final Confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
                <AlertTriangle size={20} />
                <span>Final Go Live Confirmation</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                You are about to execute a <strong className="text-slate-900 dark:text-white">permanent database reset</strong> for <strong className="text-amber-500">Thennakoon Tours</strong>.
              </p>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 space-y-1 font-mono text-[11px]">
                <p>• Test Records To Delete: <strong className="text-rose-500">{totalRecordsCount}</strong></p>
                <p>• Sequences To Restart: <strong className="text-emerald-500">8 Sequences</strong></p>
                <p>• Next Customer Code: <strong className="text-slate-900 dark:text-white">CUS-000001</strong></p>
                <p>• Next Vehicle Code: <strong className="text-slate-900 dark:text-white">VEH-000001</strong></p>
                <p>• Next Quotation #: <strong className="text-slate-900 dark:text-white">{expected.quotationNumber}</strong></p>
              </div>

              <p className="text-rose-500 font-semibold">
                This action cannot be undone. Are you completely ready to launch production?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    <span>Executing Reset...</span>
                  </>
                ) : (
                  <span>Yes, Start Production</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

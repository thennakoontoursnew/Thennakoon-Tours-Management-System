'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  X,
  Calendar,
  PenTool,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react'
import { createAgreementExtensionAction } from '@/app/(dashboard)/dashboard/agreements/extension-actions'
import { SUPPORTED_CURRENCIES } from '@/lib/utils/formatters'

export interface ExtendAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  agreementType: 'user' | 'owner'
  agreementId: string
  defaultRecipientName: string
  defaultVehicleRegNo: string
  defaultOriginalRef: string
  defaultCurrentEndDate?: string | null
  defaultRenewalAmount?: number | null
  defaultCurrency?: string
  staffProfiles?: any[]
  currentUserId?: string | null
  onCreated?: (extension: any) => void
}

function addMonthsToDate(baseDateStr: string, months: number): string {
  try {
    const clean = baseDateStr.slice(0, 10)
    const d = new Date(`${clean}T00:00:00`)
    if (isNaN(d.getTime())) return ''
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function ExtendAgreementModal({
  isOpen,
  onClose,
  agreementType,
  agreementId,
  defaultRecipientName,
  defaultVehicleRegNo,
  defaultOriginalRef,
  defaultCurrentEndDate,
  defaultRenewalAmount,
  defaultCurrency = 'LKR',
  staffProfiles = [],
  currentUserId,
  onCreated,
}: ExtendAgreementModalProps) {
  const router = useRouter()
  const todayStr = new Date().toISOString().slice(0, 10)
  const baseDate = defaultCurrentEndDate && defaultCurrentEndDate.length >= 10 ? defaultCurrentEndDate.slice(0, 10) : todayStr

  const defaultStaff =
    staffProfiles.find((p) => p.id === currentUserId) || staffProfiles[0] || null

  const [recipientName, setRecipientName] = useState(defaultRecipientName || '')
  const [vehicleRegNo, setVehicleRegNo] = useState(defaultVehicleRegNo || '')
  const [originalRef, setOriginalRef] = useState(defaultOriginalRef || '')
  const [issueDate, setIssueDate] = useState(todayStr)
  const [periodType, setPeriodType] = useState<'fixed_period' | 'until_further_notice'>('fixed_period')
  const [durationLabel, setDurationLabel] = useState('06 Months')
  const [newEndDate, setNewEndDate] = useState(addMonthsToDate(baseDate, 6) || todayStr)
  const [renewalAmount, setRenewalAmount] = useState<string>(
    defaultRenewalAmount && Number(defaultRenewalAmount) > 0 ? String(defaultRenewalAmount) : ''
  )
  const [currency, setCurrency] = useState(defaultCurrency || 'LKR')
  const [selectedOfficerId, setSelectedOfficerId] = useState(defaultStaff?.id || '')
  const [officerName, setOfficerName] = useState(defaultStaff?.full_name || 'Authorized Officer')
  const [officerDesignation, setOfficerDesignation] = useState(defaultStaff?.designation || 'Executive Operation')
  const [officerSignatureUrl, setOfficerSignatureUrl] = useState<string | null>(defaultStaff?.signature_url || null)
  const [customNotes, setCustomNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setRecipientName(defaultRecipientName || '')
      setVehicleRegNo(defaultVehicleRegNo || '')
      setOriginalRef(defaultOriginalRef || '')
      setIssueDate(todayStr)
      setPeriodType('fixed_period')
      setDurationLabel('06 Months')
      setNewEndDate(addMonthsToDate(baseDate, 6) || todayStr)
      setRenewalAmount(
        defaultRenewalAmount && Number(defaultRenewalAmount) > 0 ? String(defaultRenewalAmount) : ''
      )
      setCurrency(defaultCurrency || 'LKR')
      setCustomNotes('')
      setError(null)
      const st = staffProfiles.find((p) => p.id === currentUserId) || staffProfiles[0] || null
      if (st) {
        setSelectedOfficerId(st.id)
        setOfficerName(st.full_name || 'Authorized Officer')
        setOfficerDesignation(st.designation || 'Executive Operation')
        setOfficerSignatureUrl(st.signature_url || null)
      }
    }
  }, [isOpen, agreementId, defaultRecipientName, defaultVehicleRegNo, defaultOriginalRef, defaultCurrentEndDate, defaultRenewalAmount, defaultCurrency, currentUserId, staffProfiles])

  if (!isOpen) return null

  const handleSelectOfficer = (officerId: string) => {
    setSelectedOfficerId(officerId)
    const found = staffProfiles.find((p) => p.id === officerId)
    if (found) {
      setOfficerName(found.full_name || '')
      setOfficerDesignation(found.designation || 'Executive Operation')
      setOfficerSignatureUrl(found.signature_url || null)
    }
  }

  const applyDurationPreset = (label: string, months: number) => {
    setPeriodType('fixed_period')
    setDurationLabel(label)
    const calculated = addMonthsToDate(baseDate, months)
    if (calculated) setNewEndDate(calculated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!recipientName.trim()) {
      setError('Recipient Name is required.')
      return
    }
    if (periodType === 'fixed_period' && !newEndDate) {
      setError('Please specify the New End Date.')
      return
    }
    if (!officerName.trim() || !officerDesignation.trim()) {
      setError('Issuing officer name and designation are required.')
      return
    }

    setSubmitting(true)
    const res = await createAgreementExtensionAction({
      agreement_type: agreementType,
      user_agreement_id: agreementType === 'user' ? agreementId : null,
      owner_agreement_id: agreementType === 'owner' ? agreementId : null,
      vehicle_reg_no: vehicleRegNo,
      recipient_name: recipientName,
      issue_date: issueDate,
      extension_period_type: periodType,
      extension_duration_label: periodType === 'until_further_notice' ? 'until further notice' : durationLabel,
      new_end_date: periodType === 'fixed_period' ? newEndDate : null,
      renewal_amount: renewalAmount.trim() ? Number(renewalAmount) : null,
      currency,
      original_agreement_ref: originalRef,
      custom_notes: customNotes || null,
      issued_by_id: selectedOfficerId || currentUserId || null,
      issued_by_name: officerName,
      issued_by_designation: officerDesignation,
      issued_by_signature_url: officerSignatureUrl,
    })

    setSubmitting(false)

    if (!res.success || !res.extension) {
      setError(res.error || 'Failed to issue extension letter.')
      return
    }

    onClose()
    if (onCreated) {
      onCreated(res.extension)
    } else {
      router.push(`/dashboard/agreements/extensions/${res.extension.id}/preview`)
      router.refresh()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-850/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
              <FileText size={19} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                Extend {agreementType === 'owner' ? 'Vehicle Owner' : 'User Rental'} Agreement
              </h3>
              <p className="text-[11px] text-slate-500">
                Generate formal Extension Letter on company letterhead & update agreement end date
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient & Reference Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Recipient ({agreementType === 'owner' ? 'Vehicle Owner' : 'Customer / Company'}) *
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Vehicle Registration No.
              </label>
              <input
                type="text"
                value={vehicleRegNo}
                onChange={(e) => setVehicleRegNo(e.target.value)}
                placeholder="e.g. WP CBA-7890"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Original Agreement Ref & Date
              </label>
              <input
                type="text"
                value={originalRef}
                onChange={(e) => setOriginalRef(e.target.value)}
                placeholder="e.g. UAN15016 (agreement date 21/10/2026)"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Letter Issue Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Extension Period Section */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Calendar size={14} /> Extension Period Type
              </span>
              {defaultCurrentEndDate && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Current End: {defaultCurrentEndDate.slice(0, 10)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPeriodType('fixed_period')
                  if (durationLabel === 'until further notice') setDurationLabel('06 Months')
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  periodType === 'fixed_period'
                    ? 'bg-white dark:bg-slate-900 border-amber-500 ring-1 ring-amber-500/30 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Calendar size={16} className={periodType === 'fixed_period' ? 'text-amber-500' : 'text-slate-400'} />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Specific Duration</div>
                  <div className="text-[10px] text-slate-500">Fixed term with new end date</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPeriodType('until_further_notice')
                  setDurationLabel('until further notice')
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  periodType === 'until_further_notice'
                    ? 'bg-white dark:bg-slate-900 border-amber-500 ring-1 ring-amber-500/30 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <Clock size={16} className={periodType === 'until_further_notice' ? 'text-amber-500' : 'text-slate-400'} />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Until Further Notice</div>
                  <div className="text-[10px] text-slate-500">Open-ended ongoing extension</div>
                </div>
              </button>
            </div>

            {periodType === 'fixed_period' && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '01 Month', months: 1 },
                    { label: '03 Months', months: 3 },
                    { label: '06 Months', months: 6 },
                    { label: '01 Year', months: 12 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyDurationPreset(p.label, p.months)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                        durationLabel === p.label
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Duration Text *
                    </label>
                    <input
                      type="text"
                      required
                      value={durationLabel}
                      onChange={(e) => setDurationLabel(e.target.value)}
                      placeholder="e.g. 06 Months"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      New Agreement End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Renewal Rental Amount (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign size={14} className="text-amber-500" /> Renewal Rental Amount (Optional)
              </span>
              <span className="text-[10px] text-slate-400">Leave blank to omit amount clause from letter</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Renewal Rental Amount ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={renewalAmount}
                  onChange={(e) => setRenewalAmount(e.target.value)}
                  placeholder="Optional e.g. 225000"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Issuing Staff Officer & Digital Signature */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PenTool size={14} className="text-amber-500" /> Issuing Officer & Digital Signature
              </span>
              <Link
                href="/dashboard/profile"
                target="_blank"
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Edit My Signature / Title
              </Link>
            </div>

            {staffProfiles.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Select Issuing Staff Member
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => handleSelectOfficer(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} {p.designation ? `— ${p.designation}` : `(${p.role})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Officer Name *
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Officer Designation *
                </label>
                <input
                  type="text"
                  required
                  value={officerDesignation}
                  onChange={(e) => setOfficerDesignation(e.target.value)}
                  placeholder="e.g. Executive Operation"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-36 h-14 rounded-lg bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                {officerSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={officerSignatureUrl} alt="Staff signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center">No signature saved</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {officerSignatureUrl
                  ? 'Staff digital signature loaded and ready for letterhead rendering.'
                  : 'No digital signature saved on this officer’s profile yet. Space will remain clean above the signature line, or you can upload one in Users / Profile.'}
              </p>
            </div>
          </div>

          {/* Optional Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              Custom Notes / Additional Clauses (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Optional remarks to include in the extension letter body..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              <span>{submitting ? 'Generating Extension Letter...' : 'Generate Extension Letter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

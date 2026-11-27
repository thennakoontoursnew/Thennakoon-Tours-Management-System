'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarPlus,
  FileText,
  ExternalLink,
  PenTool,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { ExtendAgreementModal } from './extend-agreement-modal'
import { formatCurrency, formatDateOrdinal } from '@/lib/utils/formatters'

export interface ExtensionDefaults {
  defaultRecipientName: string
  defaultVehicleRegNo: string
  defaultOriginalRef: string
  defaultCurrentEndDate?: string | null
  defaultRenewalAmount?: number | null
  defaultCurrency?: string
  defaultRecipientSignatureUrl?: string | null
}

export function buildExtensionModalDefaults({
  agreementType,
  agreement,
  booking,
  customer,
  vehicle,
  owner,
  vehicles,
}: {
  agreementType: 'user' | 'owner'
  agreement: any
  booking?: any
  customer?: any
  vehicle?: any
  owner?: any
  vehicles?: any[]
}): ExtensionDefaults {
  if (agreementType === 'owner') {
    const resolvedOwner = owner || agreement?.owner
    const resolvedVehicles = vehicles || agreement?.vehicles || []
    const regNos = resolvedVehicles
      .map((item: any) => item?.vehicle?.registration_number || item?.registration_number)
      .filter(Boolean)
      .join(', ')

    const baseDate = agreement?.agreement_start_date || agreement?.agreement_date || agreement?.created_at
    const dateSuffix = baseDate ? ` dated ${formatDateOrdinal(baseDate)}` : ''

    return {
      defaultRecipientName: resolvedOwner?.full_name || resolvedOwner?.company_name || 'Vehicle Owner',
      defaultVehicleRegNo: regNos,
      defaultOriginalRef: `${agreement?.agreement_number || 'Owner Agreement'}${dateSuffix}`,
      defaultCurrentEndDate: agreement?.agreement_end_date ? String(agreement.agreement_end_date).slice(0, 10) : null,
      defaultRenewalAmount: agreement?.fixed_monthly_amount ? Number(agreement.fixed_monthly_amount) : null,
      defaultCurrency: agreement?.currency || 'LKR',
      defaultRecipientSignatureUrl:
        resolvedOwner?.signature_url ||
        agreement?.agreement_data?.signatories?.owner_signature_url ||
        null,
    }
  }

  const resolvedCustomer = customer || agreement?.customer || booking?.customer || agreement?.booking?.customer
  const custSnap = agreement?.customer_snapshot || {}
  const resolvedVehicle = vehicle || agreement?.vehicle || booking?.vehicle || agreement?.booking?.vehicle
  const vehSnap = agreement?.vehicle_snapshot || {}
  const rentalSnap = agreement?.rental_snapshot || {}

  const recipientName =
    resolvedCustomer?.full_name ||
    resolvedCustomer?.company_name ||
    custSnap?.full_name ||
    custSnap?.company_name ||
    'Customer'

  const regNo =
    resolvedVehicle?.registration_number ||
    vehSnap?.registration_number ||
    ''

  const baseDate = agreement?.agreement_date || agreement?.rental_start_at || agreement?.created_at
  const dateSuffix = baseDate ? ` dated ${formatDateOrdinal(baseDate)}` : ''

  return {
    defaultRecipientName: recipientName,
    defaultVehicleRegNo: regNo,
    defaultOriginalRef: `${agreement?.agreement_number || 'User Agreement'}${dateSuffix}`,
    defaultCurrentEndDate: agreement?.rental_end_at ? String(agreement.rental_end_at).slice(0, 10) : null,
    defaultRenewalAmount: null,
    defaultCurrency: rentalSnap?.currency || booking?.currency || agreement?.currency || 'LKR',
    defaultRecipientSignatureUrl:
      resolvedCustomer?.signature_url ||
      agreement?.customer_signature_path ||
      agreement?.lessee_snapshot?.saved_signature_url ||
      null,
  }
}

export function ExtendedBadge({
  isExtended,
  count = 0,
  className = '',
}: {
  isExtended?: boolean
  count?: number
  className?: string
}) {
  if (!isExtended && (!count || count === 0)) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 ${className}`}
      title={count > 0 ? `${count} extension letter(s) issued` : 'Agreement has been extended'}
    >
      <CheckCircle2 size={11} />
      <span>Extended{count > 1 ? ` (${count})` : ''}</span>
    </span>
  )
}

export function ExtendAgreementButton({
  agreementType,
  agreementId,
  defaults,
  staffProfiles = [],
  currentUserId,
  variant = 'toolbar',
  label,
  className = '',
}: {
  agreementType: 'user' | 'owner'
  agreementId: string
  defaults: ExtensionDefaults
  staffProfiles?: any[]
  currentUserId?: string | null
  variant?: 'compact' | 'toolbar'
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const buttonClass =
    variant === 'compact'
      ? `p-1.5 px-2 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 inline-flex items-center gap-1 font-semibold text-[11px] cursor-pointer transition-colors ${className}`
      : `px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all ${className}`

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <CalendarPlus size={variant === 'compact' ? 13 : 14} />
        <span>{label || (variant === 'compact' ? 'Extend' : 'Extend Agreement')}</span>
      </button>

      <ExtendAgreementModal
        isOpen={open}
        onClose={() => setOpen(false)}
        agreementType={agreementType}
        agreementId={agreementId}
        defaultRecipientName={defaults.defaultRecipientName}
        defaultVehicleRegNo={defaults.defaultVehicleRegNo}
        defaultOriginalRef={defaults.defaultOriginalRef}
        defaultCurrentEndDate={defaults.defaultCurrentEndDate}
        defaultRenewalAmount={defaults.defaultRenewalAmount}
        defaultCurrency={defaults.defaultCurrency}
        defaultRecipientSignatureUrl={defaults.defaultRecipientSignatureUrl}
        staffProfiles={staffProfiles}
        currentUserId={currentUserId}
      />
    </>
  )
}

export function AgreementExtensionsPanel({
  agreementType,
  agreementId,
  isExtended,
  canExtend = true,
  extensions = [],
  defaults,
  staffProfiles = [],
  currentUserId,
  variant = 'card',
  className = '',
}: {
  agreementType: 'user' | 'owner'
  agreementId: string
  isExtended?: boolean
  canExtend?: boolean
  extensions?: any[]
  defaults: ExtensionDefaults
  staffProfiles?: any[]
  currentUserId?: string | null
  variant?: 'card' | 'banner'
  className?: string
}) {
  if (variant === 'banner') {
    if (!extensions || extensions.length === 0) return null

    return (
      <div
        className={`w-full max-w-4xl mb-5 rounded-2xl bg-slate-900/90 border border-violet-500/30 p-4 text-slate-100 no-print ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Issued Extension Letters ({extensions.length})
            </span>
            <ExtendedBadge isExtended={isExtended} count={extensions.length} />
          </div>
          {canExtend && (
            <ExtendAgreementButton
              agreementType={agreementType}
              agreementId={agreementId}
              defaults={defaults}
              staffProfiles={staffProfiles}
              currentUserId={currentUserId}
              variant="compact"
              label="+ Issue Another Extension"
              className="bg-violet-500/20 text-violet-200 hover:bg-violet-500/30"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {extensions.map((ext: any) => (
            <div
              key={ext.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-amber-400">{ext.extension_number}</span>
                  <span className="text-[11px] text-slate-400">
                    Issued {formatDateOrdinal(ext.issue_date)}
                  </span>
                </div>
                <p className="text-slate-200 font-semibold mt-0.5 truncate">
                  {ext.extension_period_type === 'until_further_notice'
                    ? 'Until Further Notice'
                    : `${ext.extension_duration_label || 'Extended'}${ext.new_end_date ? ` (until ${formatDateOrdinal(ext.new_end_date)})` : ''}`}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Signed by {ext.issued_by_name} ({ext.issued_by_designation})
                  {ext.renewal_amount ? ` · ${formatCurrency(ext.renewal_amount, ext.currency || 'LKR')}` : ''}
                </p>
              </div>
              <Link
                href={`/dashboard/agreements/extensions/${ext.id}/preview`}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 inline-flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={12} />
                <span>Letterhead PDF</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileText size={16} className="text-violet-500" />
              <span>Agreement Extension Letters</span>
            </h2>
            <ExtendedBadge isExtended={isExtended || extensions.length > 0} count={extensions.length} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official extensions issued on company letterhead with staff digital signature & company seal
          </p>
        </div>

        {canExtend && (
          <ExtendAgreementButton
            agreementType={agreementType}
            agreementId={agreementId}
            defaults={defaults}
            staffProfiles={staffProfiles}
            currentUserId={currentUserId}
            variant="toolbar"
          />
        )}
      </div>

      {extensions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-500">
          No extension letters issued for this agreement yet. Click{' '}
          <span className="font-semibold text-violet-600 dark:text-violet-400">Extend Agreement</span> to
          generate one cleanly without drafting a new contract.
        </div>
      ) : (
        <div className="space-y-2.5">
          {extensions.map((ext: any) => (
            <div
              key={ext.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                    {ext.extension_number}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {ext.extension_period_type === 'until_further_notice' ? (
                      <>
                        <Clock size={10} />
                        <span>Until Further Notice</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={10} />
                        <span>
                          {ext.extension_duration_label}
                          {ext.new_end_date ? ` · Until ${formatDateOrdinal(ext.new_end_date)}` : ''}
                        </span>
                      </>
                    )}
                  </span>
                  {ext.renewal_amount && (
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(ext.renewal_amount, ext.currency || 'LKR')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>Issued on {formatDateOrdinal(ext.issue_date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <PenTool size={11} className="text-violet-500" />
                    <span>
                      {ext.issued_by_name} ({ext.issued_by_designation})
                    </span>
                  </span>
                  {ext.vehicle_reg_no && <span className="font-mono font-semibold">{ext.vehicle_reg_no}</span>}
                </div>
              </div>

              <Link
                href={`/dashboard/agreements/extensions/${ext.id}/preview`}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink size={13} />
                <span>Open Letterhead PDF</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

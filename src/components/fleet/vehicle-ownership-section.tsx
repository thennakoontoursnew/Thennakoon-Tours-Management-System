'use client'

import { useState, useMemo } from 'react'
import { Building2, Users, UserPlus, Search, CheckCircle2, Phone, Landmark, Percent } from 'lucide-react'
import type { OwnershipMode } from '@/app/(dashboard)/dashboard/vehicles/vehicle-actions'
import { SignatureUploadField } from '@/components/ui/signature-upload-field'

export interface InlineOwnerState {
  full_name: string
  owner_type: 'individual' | 'company'
  company_name: string
  national_id: string
  mobile: string
  whatsapp: string
  same_as_mobile: boolean
  email: string
  address: string
  payment_terms: 'Monthly' | 'Per Trip' | 'Weekly'
  revenue_share_pct: number
  monthly_km_quota: number
  owner_excess_km_rate: number
  bank_account_name: string
  bank_name: string
  bank_account_number: string
  bank_branch: string
  signature_url: string
  notes: string
}

export const INITIAL_INLINE_OWNER: InlineOwnerState = {
  full_name: '',
  owner_type: 'individual',
  company_name: '',
  national_id: '',
  mobile: '',
  whatsapp: '',
  same_as_mobile: false,
  email: '',
  address: '',
  payment_terms: 'Monthly',
  revenue_share_pct: 0,
  monthly_km_quota: 3000,
  owner_excess_km_rate: 0,
  bank_account_name: '',
  bank_name: '',
  bank_account_number: '',
  bank_branch: '',
  signature_url: '',
  notes: '',
}

interface VehicleOwnershipSectionProps {
  ownershipMode: OwnershipMode
  onOwnershipModeChange: (mode: OwnershipMode) => void
  owners: any[]
  existingOwnerId: string
  onExistingOwnerChange: (ownerId: string, ownerObj?: any) => void
  newOwner: InlineOwnerState
  onNewOwnerChange: (updates: Partial<InlineOwnerState>) => void
  monthlyKmQuota: number
  ownerExcessKmRate: number
  onSettlementTermChange: (field: 'monthly_km_quota' | 'owner_excess_km_rate', val: number) => void
}

export function VehicleOwnershipSection({
  ownershipMode,
  onOwnershipModeChange,
  owners,
  existingOwnerId,
  onExistingOwnerChange,
  newOwner,
  onNewOwnerChange,
  monthlyKmQuota,
  ownerExcessKmRate,
  onSettlementTermChange,
}: VehicleOwnershipSectionProps) {
  const [ownerSearch, setOwnerSearch] = useState('')

  const filteredOwners = useMemo(() => {
    if (!ownerSearch.trim()) return owners
    const q = ownerSearch.toLowerCase().trim()
    return owners.filter(
      (o) =>
        (o.full_name || '').toLowerCase().includes(q) ||
        (o.owner_number || '').toLowerCase().includes(q) ||
        (o.company_name || '').toLowerCase().includes(q) ||
        (o.mobile || '').includes(q) ||
        (o.national_id || '').toLowerCase().includes(q)
    )
  }, [owners, ownerSearch])

  const selectedOwner = useMemo(
    () => owners.find((o) => o.id === existingOwnerId) || null,
    [owners, existingOwnerId]
  )

  const handleMobileChange = (val: string) => {
    if (newOwner.same_as_mobile) {
      onNewOwnerChange({ mobile: val, whatsapp: val })
    } else {
      onNewOwnerChange({ mobile: val })
    }
  }

  const handleSameAsMobileToggle = (checked: boolean) => {
    onNewOwnerChange({
      same_as_mobile: checked,
      whatsapp: checked ? newOwner.mobile : newOwner.whatsapp,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
          Section A: Vehicle Ownership & Inline Owner Registration (Optional)
        </h3>
        <span className="text-[11px] text-slate-400">
          Leave as Company Owned or link a Vehicle Owner
        </span>
      </div>

      {/* 3-Way Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onOwnershipModeChange('company')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            ownershipMode === 'company'
              ? 'bg-amber-400/10 border-amber-500 ring-1 ring-amber-500/30 shadow-xs'
              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${ownershipMode === 'company' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <Building2 size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Company Owned</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              100% company asset. No owner needed.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOwnershipModeChange('existing')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            ownershipMode === 'existing'
              ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/30 shadow-xs'
              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${ownershipMode === 'existing' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <Users size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Select Existing Owner</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Link from {owners.length} registered partner{owners.length === 1 ? '' : 's'}.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onOwnershipModeChange('new')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
            ownershipMode === 'new'
              ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30 shadow-xs'
              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 ${ownershipMode === 'new' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
            <UserPlus size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">+ Register New Owner Inline</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Create & link a new vehicle owner now.
            </div>
          </div>
        </button>
      </div>

      {/* Mode 2: Select Existing Owner */}
      {ownershipMode === 'existing' && (
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Filter Owners</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  placeholder="Search name, phone, code..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Registered Vehicle Owner <span className="text-rose-500">*</span>
              </label>
              <select
                required={ownershipMode === 'existing'}
                value={existingOwnerId}
                onChange={(e) => {
                  const id = e.target.value
                  const obj = owners.find((o) => o.id === id)
                  onExistingOwnerChange(id, obj)
                }}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="">-- Choose Registered Owner --</option>
                {filteredOwners.map((o) => (
                  <option key={o.id} value={o.id}>
                    [{o.owner_number}] {o.full_name} {o.company_name ? `(${o.company_name})` : ''} {o.mobile ? `• ${o.mobile}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedOwner && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedOwner.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedOwner.owner_number} • {selectedOwner.owner_type}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{selectedOwner.mobile || 'No mobile'}</div>
                  <div className="text-[11px] text-slate-400">Terms: <span className="capitalize font-semibold">{(selectedOwner.payment_terms || 'monthly').replace('_', ' ')}</span></div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Landmark size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{selectedOwner.bank_name || 'Bank not set'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{selectedOwner.bank_account_number || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Register New Owner Inline */}
      {ownershipMode === 'new' && (
        <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800/60 space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <UserPlus size={15} /> Inline Vehicle Owner Registration
            </span>
            <span className="text-[11px] text-slate-500">Auto-generates OWN-YYYY-XXXXXX & links upon save</span>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required={ownershipMode === 'new'}
                value={newOwner.full_name}
                onChange={(e) => onNewOwnerChange({ full_name: e.target.value })}
                placeholder="Owner full legal name"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Type</label>
              <select
                value={newOwner.owner_type}
                onChange={(e) => onNewOwnerChange({ owner_type: e.target.value as 'individual' | 'company' })}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                value={newOwner.company_name}
                onChange={(e) => onNewOwnerChange({ company_name: e.target.value })}
                placeholder="Optional if company"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">National ID (NIC / Passport)</label>
              <input
                type="text"
                value={newOwner.national_id}
                onChange={(e) => onNewOwnerChange({ national_id: e.target.value })}
                placeholder="e.g. 881843935V"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Mobile</label>
              <input
                type="tel"
                value={newOwner.mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                placeholder="+94 77 xxx xxxx"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">WhatsApp</label>
                <label className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOwner.same_as_mobile}
                    onChange={(e) => handleSameAsMobileToggle(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Same as Mobile</span>
                </label>
              </div>
              <input
                type="tel"
                value={newOwner.whatsapp}
                disabled={newOwner.same_as_mobile}
                onChange={(e) => onNewOwnerChange({ whatsapp: e.target.value })}
                placeholder="+94 77 xxx xxxx"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={newOwner.email}
                onChange={(e) => onNewOwnerChange({ email: e.target.value })}
                placeholder="owner@example.com"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Address</label>
              <input
                type="text"
                value={newOwner.address}
                onChange={(e) => onNewOwnerChange({ address: e.target.value })}
                placeholder="Residential / Business address"
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Agreement & Settlement Terms */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Percent size={13} /> Agreement & Settlement Terms
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Terms</label>
                <select
                  value={newOwner.payment_terms}
                  onChange={(e) => onNewOwnerChange({ payment_terms: e.target.value as 'Monthly' | 'Per Trip' | 'Weekly' })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Per Trip">Per Trip</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Revenue Share %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newOwner.revenue_share_pct}
                  onChange={(e) => onNewOwnerChange({ revenue_share_pct: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Monthly KM Quota</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={monthlyKmQuota}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0
                    onNewOwnerChange({ monthly_km_quota: val })
                    onSettlementTermChange('monthly_km_quota', val)
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Excess KM Rate (LKR/km)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={ownerExcessKmRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    onNewOwnerChange({ owner_excess_km_rate: val })
                    onSettlementTermChange('owner_excess_km_rate', val)
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Landmark size={13} /> Bank Payout Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={newOwner.bank_account_name}
                  onChange={(e) => onNewOwnerChange({ bank_account_name: e.target.value })}
                  placeholder="As per bank book"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={newOwner.bank_name}
                  onChange={(e) => onNewOwnerChange({ bank_name: e.target.value })}
                  placeholder="e.g. Commercial Bank"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Account Number</label>
                <input
                  type="text"
                  value={newOwner.bank_account_number}
                  onChange={(e) => onNewOwnerChange({ bank_account_number: e.target.value })}
                  placeholder="Account No."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
                <input
                  type="text"
                  value={newOwner.bank_branch}
                  onChange={(e) => onNewOwnerChange({ bank_branch: e.target.value })}
                  placeholder="e.g. Maharagama"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Saved E-Signature */}
          <SignatureUploadField
            value={newOwner.signature_url}
            onChange={(url) => onNewOwnerChange({ signature_url: url || '' })}
            entityFolder="owners"
            entityId="inline-owner"
            label="Owner Saved E-Signature (Optional)"
            compact
          />

          {/* Internal Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Internal Notes</label>
            <textarea
              rows={2}
              value={newOwner.notes}
              onChange={(e) => onNewOwnerChange({ notes: e.target.value })}
              placeholder="Optional agreement notes, handover instructions, or payout preferences..."
              className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

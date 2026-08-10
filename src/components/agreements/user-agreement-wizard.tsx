'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  User,
  Car,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  ShieldAlert,
  CheckCircle,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { UserAgreementFormData, validateUserAgreementData } from '@/lib/agreements/user-agreement-service'
import { USER_AGREEMENT_VERSION } from '@/lib/agreements/templates/user-agreement-v1'
import { generateAndLockUserAgreement, createOrUpdateUserAgreementDraft } from '@/app/(dashboard)/dashboard/agreements/user-agreement-actions'

interface UserAgreementWizardProps {
  initialData: UserAgreementFormData
}

export function UserAgreementWizard({ initialData }: UserAgreementWizardProps) {
  const router = useRouter()
  const [form, setForm] = useState<UserAgreementFormData>(initialData)
  const [activeSection, setActiveSection] = useState<string>('A')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const validation = validateUserAgreementData(form)

  const handleSaveDraft = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await createOrUpdateUserAgreementDraft(form)
      if (res.success && res.agreement) {
        alert('Draft saved successfully!')
        router.refresh()
      } else {
        setError(res.error || 'Failed to save draft.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await generateAndLockUserAgreement(form)
      if (res.success && res.agreement) {
        router.push(`/dashboard/agreements/${res.agreement.id}/preview`)
      } else {
        setError(res.error || 'Failed to generate agreement.')
      }
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'A', label: 'A. Agreement Info', badge: 'AUTO-FILLED' },
    { id: 'B', label: 'B. Lessee Info', badge: 'AUTO-FILLED' },
    { id: 'C', label: 'C. Vehicle Info', badge: 'AUTO-FILLED' },
    { id: 'D', label: 'D. Rental Info', badge: 'AUTO-FILLED' },
    { id: 'E', label: 'E. Charges & Deposit', badge: 'AUTO-FILLED' },
    { id: 'F', label: 'F. Nominated Drivers', badge: 'MANUAL' },
    { id: 'G', label: 'G. Pickup & Delivery', badge: 'MANUAL' },
    { id: 'H', label: 'H. Special Notes', badge: 'MANUAL' },
    { id: 'I', label: 'I. Lessor Rep', badge: 'AUTO-FILLED' },
    { id: 'J', label: 'J. Witnesses', badge: 'MANUAL' },
    { id: 'K', label: 'K. Review & Generate', badge: 'LOCKED TERMS' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-500 text-sm">{form.agreement_number}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
              {form.template_version}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            User Agreement Details Form
          </h1>
          <p className="text-xs text-slate-400">
            Review auto-filled database data, complete agreement-specific fields, and generate locked snapshot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={handleGenerate}
            disabled={saving || !validation.isValid}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving ? 'Generating...' : 'Generate & Lock Snapshot'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === s.id
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>{s.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${s.badge === 'AUTO-FILLED' ? 'bg-emerald-500/10 text-emerald-600' : s.badge === 'MANUAL' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-200 text-slate-700'}`}>
              {s.badge}
            </span>
          </button>
        ))}
      </div>

      {/* SECTION A: AGREEMENT INFORMATION */}
      {activeSection === 'A' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">A. Agreement Information</h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded">AUTO-FILLED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Agreement Number (Auto)</label>
              <input
                disabled
                value={form.agreement_number}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Agreement Date</label>
              <input
                type="date"
                value={form.agreement_date}
                onChange={(e) => setForm({ ...form, agreement_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Legal Template Version</label>
              <input
                disabled
                value={form.template_version}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: LESSEE INFORMATION */}
      {activeSection === 'B' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">B. Lessee Information (Hirer)</h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded">AUTO-FILLED WITH MANUAL OVERRIDE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name & Surname *</label>
              <input
                value={form.lessee.full_name}
                onChange={(e) => setForm({ ...form, lessee: { ...form.lessee, full_name: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Company Name (If corporate)</label>
              <input
                value={form.lessee.company_name || ''}
                onChange={(e) => setForm({ ...form, lessee: { ...form.lessee, company_name: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NIC / Passport Number *</label>
              <input
                value={form.lessee.identifier_no}
                onChange={(e) => setForm({ ...form, lessee: { ...form.lessee, identifier_no: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Phone *</label>
              <input
                value={form.lessee.mobile}
                onChange={(e) => setForm({ ...form, lessee: { ...form.lessee, mobile: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Registered Postal Address *</label>
              <input
                value={form.lessee.address}
                onChange={(e) => setForm({ ...form, lessee: { ...form.lessee, address: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: VEHICLE INFORMATION */}
      {activeSection === 'C' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">C. Vehicle Information</h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded">AUTO-FILLED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Vehicle Name / Make & Model</label>
              <input
                value={form.vehicle.make_model}
                onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, make_model: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Registration Number *</label>
              <input
                value={form.vehicle.registration_number}
                onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, registration_number: e.target.value } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pickup Odometer (KM)</label>
              <input
                type="number"
                value={form.vehicle.pickup_odometer || 0}
                onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, pickup_odometer: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION D & E: RENTAL & FINANCIAL INFORMATION */}
      {(activeSection === 'D' || activeSection === 'E') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">D & E. Rental & Financial Information</h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded">AUTO-FILLED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Daily Rental Tariff (LKR) *</label>
              <input
                type="number"
                value={form.rental.daily_rental_rate}
                onChange={(e) => setForm({ ...form, rental: { ...form.rental, daily_rental_rate: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Security Deposit (LKR) *</label>
              <input
                type="number"
                value={form.rental.security_deposit}
                onChange={(e) => setForm({ ...form, rental: { ...form.rental, security_deposit: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-emerald-600"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Excess KM Charge (LKR/KM)</label>
              <input
                type="number"
                value={form.rental.extra_km_rate}
                onChange={(e) => setForm({ ...form, rental: { ...form.rental, extra_km_rate: Number(e.target.value) } })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: NOMINATED DRIVERS */}
      {activeSection === 'F' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">F. Nominated Driver(s)</h2>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded">MANUAL / SCHEDULE</span>
          </div>

          {(form.nominated_drivers || []).map((d, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Driver Name</label>
                <input
                  value={d.name}
                  onChange={(e) => {
                    const list = [...form.nominated_drivers]
                    list[idx].name = e.target.value
                    setForm({ ...form, nominated_drivers: list })
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Driving License Number</label>
                <input
                  value={d.license_number}
                  onChange={(e) => {
                    const list = [...form.nominated_drivers]
                    list[idx].license_number = e.target.value
                    setForm({ ...form, nominated_drivers: list })
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Driver Mobile</label>
                <input
                  value={d.mobile || ''}
                  onChange={(e) => {
                    const list = [...form.nominated_drivers]
                    list[idx].mobile = e.target.value
                    setForm({ ...form, nominated_drivers: list })
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION K: REVIEW & GENERATE */}
      {activeSection === 'K' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">K. Review & Final Token Validation</h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${validation.isValid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {validation.isValid ? 'VALIDATED — READY TO LOCK' : 'UNRESOLVED REQUIRED TOKENS'}
            </span>
          </div>

          {!validation.isValid && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs space-y-1">
              <span className="font-bold block">The following required tokens are missing:</span>
              <ul className="list-disc list-inside font-mono text-[11px]">
                {validation.missingTokens.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-xs leading-relaxed space-y-1">
            <span className="font-bold block">Legal Wording Lock Protection:</span>
            <span>Generating this agreement will lock all 18 official legal clauses, schedule snapshots, and token values into an unalterable snapshot (`{USER_AGREEMENT_VERSION}`).</span>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleGenerate}
              disabled={saving || !validation.isValid}
              className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              <Lock size={15} />
              <span>{saving ? 'Generating...' : 'Generate User Agreement PDF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

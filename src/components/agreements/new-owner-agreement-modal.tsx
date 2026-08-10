'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, X, CheckCircle, Car, DollarSign, ShieldAlert } from 'lucide-react'
import { createOwnerAgreementAction } from '@/app/(dashboard)/dashboard/agreements/agreement-actions'

interface NewOwnerAgreementModalProps {
  owners: any[]
  vehicles: any[]
  isOpen: boolean
  onClose: () => void
}

export function NewOwnerAgreementModal({
  owners,
  vehicles,
  isOpen,
  onClose,
}: NewOwnerAgreementModalProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [settlementRule, setSettlementRule] = useState('percentage')
  const [revenueSharePct, setRevenueSharePct] = useState('70')
  const [flatRatePerDay, setFlatRatePerDay] = useState('')
  const [fixedMonthlyAmount, setFixedMonthlyAmount] = useState('')
  const [perBookingAmount, setPerBookingAmount] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('0')
  const [advanceAmount, setAdvanceAmount] = useState('0')
  const [maintenanceResp, setMaintenanceResp] = useState('owner')
  const [insuranceResp, setInsuranceResp] = useState('owner')
  const [repairResp, setRepairResp] = useState('owner')
  const [terms, setTerms] = useState(
    '1. Vehicle owner agrees to lease vehicle to Thennakoon Tours for operations.\n2. Settlement calculations strictly follow the agreed settlement rule.\n3. Routine maintenance responsibility rests with vehicle owner unless specified.'
  )

  if (!isOpen) return null

  // Filter vehicles belonging to selected vehicle owner
  const availableVehicles = selectedOwnerId
    ? vehicles.filter((v) => v.vehicle_owner_id === selectedOwnerId)
    : []

  const toggleVehicleSelection = (vid: string) => {
    if (selectedVehicleIds.includes(vid)) {
      setSelectedVehicleIds(selectedVehicleIds.filter((id) => id !== vid))
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, vid])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwnerId) {
      alert('Please select a Vehicle Owner')
      return
    }

    setSubmitting(true)
    try {
      const res = await createOwnerAgreementAction({
        vehicle_owner_id: selectedOwnerId,
        vehicle_ids: selectedVehicleIds,
        agreement_start_date: startDate,
        agreement_end_date: endDate || undefined,
        settlement_rule: settlementRule,
        revenue_share_pct: revenueSharePct ? Number(revenueSharePct) : undefined,
        flat_rate_per_day: flatRatePerDay ? Number(flatRatePerDay) : undefined,
        fixed_monthly_amount: fixedMonthlyAmount ? Number(fixedMonthlyAmount) : undefined,
        per_booking_amount: perBookingAmount ? Number(perBookingAmount) : undefined,
        security_deposit: Number(securityDeposit || 0),
        advance_amount: Number(advanceAmount || 0),
        maintenance_responsibility: maintenanceResp,
        insurance_responsibility: insuranceResp,
        repair_responsibility: repairResp,
        terms_and_conditions: terms,
      })

      if (res.success) {
        onClose()
        router.refresh()
      } else {
        alert(res.error || 'Failed to create Owner Agreement')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">New Owner Agreement</h3>
              <p className="text-slate-400 text-xs">Agreement between Thennakoon Tours and Vehicle Owner</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Step 1: Vehicle Owner Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">1. Select Vehicle Owner *</label>
            <select
              required
              value={selectedOwnerId}
              onChange={(e) => {
                setSelectedOwnerId(e.target.value)
                setSelectedVehicleIds([])
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none"
            >
              <option value="">Choose Partner / Vehicle Owner...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name} ({o.owner_number}) {o.company_name ? `— ${o.company_name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Vehicle Selection */}
          {selectedOwnerId && (
            <div className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
              <label className="font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                <Car size={14} className="text-amber-500" /> 2. Select Covered Vehicles ({selectedVehicleIds.length} selected)
              </label>
              {availableVehicles.length === 0 ? (
                <div className="text-slate-400 italic text-[11px]">No registered vehicles linked to this owner.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {availableVehicles.map((v) => {
                    const checked = selectedVehicleIds.includes(v.id)
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicleSelection(v.id)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          checked
                            ? 'bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-400 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{v.vehicle_name}</span>
                        {checked && <CheckCircle size={13} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Agreement Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Agreement Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Agreement End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Optional (Open-ended)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Step 4 & 5: Settlement Rule & Financial Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Settlement Rule *</label>
              <select
                value={settlementRule}
                onChange={(e) => setSettlementRule(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none"
              >
                <option value="percentage">Percentage Share (%)</option>
                <option value="fixed_daily">Fixed Daily Rate (LKR)</option>
                <option value="fixed_monthly">Fixed Monthly Payout (LKR)</option>
                <option value="per_booking">Per Booking Flat Amount (LKR)</option>
                <option value="manual">Manual Settlement</option>
              </select>
            </div>

            {settlementRule === 'percentage' && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Owner Revenue Share (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={revenueSharePct}
                  onChange={(e) => setRevenueSharePct(e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            {settlementRule === 'fixed_daily' && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Flat Rate Per Day (LKR)</label>
                <input
                  type="number"
                  value={flatRatePerDay}
                  onChange={(e) => setFlatRatePerDay(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            {settlementRule === 'fixed_monthly' && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fixed Monthly Amount (LKR)</label>
                <input
                  type="number"
                  value={fixedMonthlyAmount}
                  onChange={(e) => setFixedMonthlyAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Step 6: Responsibilities */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Maintenance</label>
              <select
                value={maintenanceResp}
                onChange={(e) => setMaintenanceResp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="owner">Vehicle Owner</option>
                <option value="company">Thennakoon Tours</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Insurance</label>
              <select
                value={insuranceResp}
                onChange={(e) => setInsuranceResp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="owner">Vehicle Owner</option>
                <option value="company">Thennakoon Tours</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Repairs</label>
              <select
                value={repairResp}
                onChange={(e) => setRepairResp(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="owner">Vehicle Owner</option>
                <option value="company">Thennakoon Tours</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Terms & Conditions</label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Generate Owner Agreement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

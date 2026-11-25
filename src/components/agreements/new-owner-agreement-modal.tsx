'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  X,
  CheckCircle,
  Car,
  DollarSign,
  Calendar,
  Building,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { createOwnerAgreementAction } from '@/app/(dashboard)/dashboard/agreements/agreement-actions'

interface NewOwnerAgreementModalProps {
  owners: any[]
  vehicles: any[]
  isOpen: boolean
  onClose: () => void
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatToOrdinalDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const day = getOrdinal(d.getDate())
    const month = d.toLocaleString('en-US', { month: 'long' })
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return dateStr
  }
}

function formatToSlashDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

function calculateEndDate(startDateStr: string, duration: string): string {
  if (!startDateStr) return ''
  try {
    const d = new Date(startDateStr + 'T00:00:00')
    let monthsToAdd = 1
    if (duration.includes('03') || duration.toLowerCase().includes('3 month')) monthsToAdd = 3
    else if (duration.includes('06') || duration.toLowerCase().includes('6 month')) monthsToAdd = 6
    else if (duration.includes('YEAR') || duration.toLowerCase().includes('1 year')) monthsToAdd = 12
    else if (duration.includes('02') || duration.toLowerCase().includes('2 month')) monthsToAdd = 2

    d.setMonth(d.getMonth() + monthsToAdd)
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function NewOwnerAgreementModal({
  owners,
  vehicles,
  isOpen,
  onClose,
}: NewOwnerAgreementModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'parties' | 'term' | 'financials' | 'signatories'>('parties')
  const [submitting, setSubmitting] = useState(false)

  // 1. Owner & Vehicle Selection
  const [selectedOwnerId, setSelectedOwnerId] = useState('')
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])

  // Owner editable fields
  const [ownerFullName, setOwnerFullName] = useState('')
  const [ownerNic, setOwnerNic] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')

  // Vehicle editable fields
  const [vehicleMakeModel, setVehicleMakeModel] = useState('')
  const [vehicleRegNo, setVehicleRegNo] = useState('')
  const [vehicleChassis, setVehicleChassis] = useState('')
  const [vehicleEngine, setVehicleEngine] = useState('')
  const [vehicleMileage, setVehicleMileage] = useState('')

  // 2. Term & Dates
  const todayIso = new Date().toISOString().slice(0, 10)
  const [executionDate, setExecutionDate] = useState(todayIso)
  const [executionDateFormatted, setExecutionDateFormatted] = useState(formatToOrdinalDate(todayIso))
  const [initialAgreementDate, setInitialAgreementDate] = useState('')
  const [termDuration, setTermDuration] = useState('01 MONTH')
  const [startDate, setStartDate] = useState(todayIso)
  const [endDate, setEndDate] = useState(calculateEndDate(todayIso, '01 MONTH'))
  const [handoverDate, setHandoverDate] = useState(todayIso)

  // 3. Financial & Service Terms
  const [settlementRule, setSettlementRule] = useState('fixed_monthly')
  const [monthlyRental, setMonthlyRental] = useState('350000')
  const [revenueSharePct, setRevenueSharePct] = useState('70')
  const [flatRatePerDay, setFlatRatePerDay] = useState('')
  const [monthlyMileageQuota, setMonthlyMileageQuota] = useState('3000')
  const [excessMileageRate, setExcessMileageRate] = useState('117')
  const [serviceIntervalMileage, setServiceIntervalMileage] = useState('5000')
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState('30th')
  const [renewalCharge, setRenewalCharge] = useState('3000')
  const [terminationNoticeDays, setTerminationNoticeDays] = useState('30')

  // Bank Details
  const [bankName, setBankName] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')

  // 4. Signatories & Remarks
  const [companyRepName, setCompanyRepName] = useState('HBNK Dissanayaka')
  const [companyRepDesignation, setCompanyRepDesignation] = useState('Technical Officer')
  const [companyRepNic, setCompanyRepNic] = useState('881843935V')
  const [companyWitnessName, setCompanyWitnessName] = useState('')
  const [companyWitnessNic, setCompanyWitnessNic] = useState('')

  const [ownerWitnessName, setOwnerWitnessName] = useState('')
  const [ownerWitnessNic, setOwnerWitnessNic] = useState('')
  const [ownerWitnessAddress, setOwnerWitnessAddress] = useState('')
  const [ownerWitnessContact, setOwnerWitnessContact] = useState('')
  const [ownerWitnessCompany, setOwnerWitnessCompany] = useState('')

  const [specialRemarks, setSpecialRemarks] = useState('')

  // Auto-fill when Owner changes
  useEffect(() => {
    if (!selectedOwnerId) {
      setOwnerFullName('')
      setOwnerNic('')
      setOwnerAddress('')
      setOwnerPhone('')
      setOwnerEmail('')
      setBankName('')
      setBankBranch('')
      setBankAccountNo('')
      setAccountHolderName('')
      return
    }

    const o = owners.find((item) => item.id === selectedOwnerId)
    if (o) {
      setOwnerFullName(o.full_name || '')
      setOwnerNic(o.national_id || '')
      setOwnerAddress(o.address || '')
      setOwnerPhone(o.mobile || o.whatsapp || '')
      setOwnerEmail(o.email || '')
      setBankName(o.bank_name || '')
      setBankBranch(o.bank_branch || '')
      setBankAccountNo(o.bank_account_number || '')
      setAccountHolderName(o.full_name || '')
    }
  }, [selectedOwnerId, owners])

  // Filter available vehicles for selected owner
  const availableVehicles = selectedOwnerId
    ? vehicles.filter((v) => v.vehicle_owner_id === selectedOwnerId)
    : []

  // Auto-fill when Vehicle selection changes
  useEffect(() => {
    if (selectedVehicleIds.length === 0) {
      setVehicleMakeModel('')
      setVehicleRegNo('')
      setVehicleChassis('')
      setVehicleEngine('')
      setVehicleMileage('')
      return
    }

    const firstVid = selectedVehicleIds[0]
    const v = vehicles.find((item) => item.id === firstVid)
    if (v) {
      const makeModel = [v.brand, v.model].filter(Boolean).join(' ') || v.vehicle_name || ''
      setVehicleMakeModel(makeModel)
      setVehicleRegNo(v.registration_number || '')
      setVehicleChassis(v.chassis_number || '')
      setVehicleEngine(v.engine_number || '')
      setVehicleMileage(v.current_mileage ? String(v.current_mileage) : '')
      if (v.agreed_payout_rate) {
        setMonthlyRental(String(v.agreed_payout_rate))
      }
    }
  }, [selectedVehicleIds, vehicles])

  // Auto-calculate end date when startDate or termDuration changes
  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    setEndDate(calculateEndDate(val, termDuration))
  }

  const handleTermDurationChange = (val: string) => {
    setTermDuration(val)
    setEndDate(calculateEndDate(startDate, val))
  }

  const handleExecutionDateChange = (val: string) => {
    setExecutionDate(val)
    setExecutionDateFormatted(formatToOrdinalDate(val))
  }

  const toggleVehicleSelection = (vid: string) => {
    if (selectedVehicleIds.includes(vid)) {
      setSelectedVehicleIds(selectedVehicleIds.filter((id) => id !== vid))
    } else {
      setSelectedVehicleIds([vid]) // Typically 1 vehicle per standard vehicle owner agreement
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOwnerId) {
      alert('Please select a Vehicle Owner')
      setActiveTab('parties')
      return
    }

    if (selectedVehicleIds.length === 0) {
      alert('Please select at least one Vehicle for this Agreement')
      setActiveTab('parties')
      return
    }

    setSubmitting(true)
    try {
      const agreementDataPayload = {
        execution_date: executionDate,
        execution_date_formatted: executionDateFormatted || formatToOrdinalDate(executionDate),
        initial_agreement_date: initialAgreementDate || null,
        initial_agreement_date_formatted: initialAgreementDate ? formatToSlashDate(initialAgreementDate) : null,
        term_duration: termDuration,
        start_date: startDate,
        start_date_formatted: formatToSlashDate(startDate),
        end_date: endDate,
        end_date_formatted: formatToSlashDate(endDate),
        handover_date: handoverDate,
        handover_date_formatted: formatToSlashDate(handoverDate),

        owner: {
          full_name: ownerFullName,
          national_id: ownerNic,
          address: ownerAddress,
          phone: ownerPhone,
          email: ownerEmail,
        },

        vehicle: {
          make_model: vehicleMakeModel,
          registration_number: vehicleRegNo,
          chassis_number: vehicleChassis,
          engine_number: vehicleEngine,
          current_mileage: vehicleMileage,
        },

        financials: {
          settlement_rule: settlementRule,
          monthly_rental: monthlyRental ? Number(monthlyRental.replace(/[^0-9.]/g, '')) : 350000,
          monthly_mileage_quota_km: Number(monthlyMileageQuota) || 3000,
          excess_mileage_rate_per_km: Number(excessMileageRate) || 117,
          service_interval_km: Number(serviceIntervalMileage) || 5000,
          payment_day_of_month: paymentDayOfMonth || '30th',
          renewal_charge: Number(renewalCharge) || 3000,
          termination_notice_days: Number(terminationNoticeDays) || 30,
        },

        bank_details: {
          account_holder_name: accountHolderName || ownerFullName,
          bank_name: bankName,
          bank_branch: bankBranch,
          bank_account_number: bankAccountNo,
        },

        signatories: {
          company_rep_name: companyRepName,
          company_rep_designation: companyRepDesignation,
          company_rep_nic: companyRepNic,
          company_witness_name: companyWitnessName,
          company_witness_nic: companyWitnessNic,
          owner_witness_name: ownerWitnessName,
          owner_witness_nic: ownerWitnessNic,
          owner_witness_address: ownerWitnessAddress,
          owner_witness_contact: ownerWitnessContact,
          owner_witness_company: ownerWitnessCompany,
        },

        special_remarks: specialRemarks || null,
      }

      const res = await createOwnerAgreementAction({
        vehicle_owner_id: selectedOwnerId,
        vehicle_ids: selectedVehicleIds,
        agreement_start_date: startDate,
        agreement_end_date: endDate || undefined,
        settlement_rule: settlementRule,
        fixed_monthly_amount: monthlyRental ? Number(monthlyRental.replace(/[^0-9.]/g, '')) : undefined,
        revenue_share_pct: revenueSharePct ? Number(revenueSharePct) : undefined,
        flat_rate_per_day: flatRatePerDay ? Number(flatRatePerDay) : undefined,
        termination_notice_days: Number(terminationNoticeDays) || 30,
        special_conditions: specialRemarks || undefined,
        agreement_data: agreementDataPayload,
      })

      if (res.success && res.agreement) {
        onClose()
        router.push(`/dashboard/agreements/owner/${res.agreement.id}`)
        router.refresh()
      } else {
        alert(res.error || 'Failed to create Owner Agreement')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">New Vehicle Owner Rental Agreement</h3>
              <p className="text-slate-400 text-xs">Official 10-clause legal rental agreement for partner fleet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 gap-2 text-xs font-bold overflow-x-auto shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('parties')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'parties'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <User size={14} /> 1. Owner & Vehicle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('term')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'term'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Calendar size={14} /> 2. Term & Validity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'financials'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <DollarSign size={14} /> 3. Financials & Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signatories')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'signatories'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck size={14} /> 4. Signatories & Remarks
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* TAB 1: OWNER & VEHICLE */}
          {activeTab === 'parties' && (
            <div className="space-y-4">
              {/* Select Vehicle Owner */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Select Vehicle Owner *
                </label>
                <select
                  required
                  value={selectedOwnerId}
                  onChange={(e) => {
                    setSelectedOwnerId(e.target.value)
                    setSelectedVehicleIds([])
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Choose Registered Vehicle Owner...</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.full_name} ({o.owner_number || 'No ID'}) {o.national_id ? `— NIC: ${o.national_id}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner Auto-filled & Editable Fields */}
              {selectedOwnerId && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Owner Particulars (Legal Clause 2)</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Auto-filled • Editable</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        value={ownerFullName}
                        onChange={(e) => setOwnerFullName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">NIC / Passport Number</label>
                      <input
                        type="text"
                        required
                        value={ownerNic}
                        onChange={(e) => setOwnerNic(e.target.value)}
                        placeholder="e.g. 198512345678 or 851234567V"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Registered Address (for Legal Notices)</label>
                    <input
                      type="text"
                      required
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      placeholder="e.g. No. 123, Galle Road, Colombo 03"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Notice Email</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Select Vehicle */}
              {selectedOwnerId && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Car size={15} className="text-amber-500" /> Select Leased Vehicle *
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {availableVehicles.length} vehicle(s) registered under this owner
                    </span>
                  </label>

                  {availableVehicles.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs">
                      No vehicles are currently linked to this owner. Please assign or register a vehicle under this owner first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableVehicles.map((v) => {
                        const isSelected = selectedVehicleIds.includes(v.id)
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => toggleVehicleSelection(v.id)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-black text-xs">{v.registration_number || 'NO REG'}</div>
                              <div className="text-[11px] text-slate-500 font-normal">
                                {v.brand} {v.model || v.vehicle_name}
                              </div>
                            </div>
                            {isSelected && <CheckCircle size={16} className="text-amber-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Particulars (Schedule) */}
              {selectedVehicleIds.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Vehicle Schedule Particulars</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Auto-filled • Editable</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Make & Model</label>
                      <input
                        type="text"
                        required
                        value={vehicleMakeModel}
                        onChange={(e) => setVehicleMakeModel(e.target.value)}
                        placeholder="e.g. Toyota KDH 200 / Suzuki Wagon R"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Registration Number</label>
                      <input
                        type="text"
                        required
                        value={vehicleRegNo}
                        onChange={(e) => setVehicleRegNo(e.target.value)}
                        placeholder="e.g. WP CBA-1234"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Chassis Number</label>
                      <input
                        type="text"
                        value={vehicleChassis}
                        onChange={(e) => setVehicleChassis(e.target.value)}
                        placeholder="e.g. KDH201-1002345"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Engine Number</label>
                      <input
                        type="text"
                        value={vehicleEngine}
                        onChange={(e) => setVehicleEngine(e.target.value)}
                        placeholder="e.g. 1KD-1234567"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Current Mileage (Km)</label>
                      <input
                        type="text"
                        value={vehicleMileage}
                        onChange={(e) => setVehicleMileage(e.target.value)}
                        placeholder="e.g. 75400"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TERM & VALIDITY */}
          {activeTab === 'term' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Agreement Execution Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={executionDate}
                    onChange={(e) => handleExecutionDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono">
                    Renders as: &quot;{executionDateFormatted}&quot;
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Handover Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={handoverDate}
                    onChange={(e) => setHandoverDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Date vehicle physically handed over (Clause 1.1)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Term Duration *
                  </label>
                  <select
                    value={termDuration}
                    onChange={(e) => handleTermDurationChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="01 MONTH">01 MONTH</option>
                    <option value="02 MONTHS">02 MONTHS</option>
                    <option value="03 MONTHS">03 MONTHS</option>
                    <option value="06 MONTHS">06 MONTHS</option>
                    <option value="01 YEAR">01 YEAR</option>
                    <option value="02 YEARS">02 YEARS</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Initial Agreement Date (for renewal) */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Initial Agreement Date (If this is a renewal/replacement)
                </label>
                <input
                  type="date"
                  value={initialAgreementDate}
                  onChange={(e) => setInitialAgreementDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">
                  If filled, Clause 1.3 will state: &quot;This Agreement supersedes and replaces the initial agreement entered into on [Date]&quot;. Leave blank if this is the first agreement.
                </p>
              </div>

              {/* Termination Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Termination Notice Period (Days)
                  </label>
                  <input
                    type="number"
                    value={terminationNoticeDays}
                    onChange={(e) => setTerminationNoticeDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 30 days prior written notice (Clause 6.1)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS & BANK */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <DollarSign size={16} /> Commercial Payment Structure (Clauses 4 & 5)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Agreed Monthly Rental (Rs.) *
                    </label>
                    <input
                      type="text"
                      required
                      value={monthlyRental}
                      onChange={(e) => setMonthlyRental(e.target.value)}
                      placeholder="e.g. 350,000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Monthly Payment Day *
                    </label>
                    <input
                      type="text"
                      value={paymentDayOfMonth}
                      onChange={(e) => setPaymentDayOfMonth(e.target.value)}
                      placeholder="e.g. 30th"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Default: 30th of each calendar month</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Renewal Document Fee (Rs.)
                    </label>
                    <input
                      type="number"
                      value={renewalCharge}
                      onChange={(e) => setRenewalCharge(e.target.value)}
                      placeholder="e.g. 3000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: Rs. 3,000/- upon renewal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Monthly Mileage Quota (Km) *
                    </label>
                    <input
                      type="number"
                      required
                      value={monthlyMileageQuota}
                      onChange={(e) => setMonthlyMileageQuota(e.target.value)}
                      placeholder="e.g. 3000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 3,000 Km per month</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Excess Mileage Rate (Rs./Km) *
                    </label>
                    <input
                      type="number"
                      required
                      value={excessMileageRate}
                      onChange={(e) => setExcessMileageRate(e.target.value)}
                      placeholder="e.g. 117"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Rate per Km over quota</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Service Interval (Km) *
                    </label>
                    <input
                      type="number"
                      required
                      value={serviceIntervalMileage}
                      onChange={(e) => setServiceIntervalMileage(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Routine service borne by owner</span>
                  </div>
                </div>
              </div>

              {/* Owner Bank Account Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building size={14} className="text-amber-500" /> Owner Remittance Bank Account (Clause 5.3)
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Auto-filled • Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as registered with bank"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Commercial Bank of Ceylon / HNB"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="Account number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Bank Branch</label>
                    <input
                      type="text"
                      required
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="Branch name (e.g. Kohuwala / Nugegoda)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIGNATORIES & REMARKS */}
          {activeTab === 'signatories' && (
            <div className="space-y-4">
              {/* Company Representative */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-200 dark:border-slate-800 pb-1">
                  Thennakoon Tours (Pvt) Ltd Representative (First Party)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Authorized Officer Name</label>
                    <input
                      type="text"
                      required
                      value={companyRepName}
                      onChange={(e) => setCompanyRepName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={companyRepDesignation}
                      onChange={(e) => setCompanyRepDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">NIC Number</label>
                    <input
                      type="text"
                      required
                      value={companyRepNic}
                      onChange={(e) => setCompanyRepNic(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Company Witness Name (Optional)</label>
                    <input
                      type="text"
                      value={companyWitnessName}
                      onChange={(e) => setCompanyWitnessName(e.target.value)}
                      placeholder="Witness Name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Company Witness NIC (Optional)</label>
                    <input
                      type="text"
                      value={companyWitnessNic}
                      onChange={(e) => setCompanyWitnessNic(e.target.value)}
                      placeholder="Witness NIC"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Witness Particulars */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-200 dark:border-slate-800 pb-1">
                  Vehicle Owner Witness Particulars (Second Party)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Witness Full Name</label>
                    <input
                      type="text"
                      value={ownerWitnessName}
                      onChange={(e) => setOwnerWitnessName(e.target.value)}
                      placeholder="Full Name of Witness"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Witness NIC / Passport</label>
                    <input
                      type="text"
                      value={ownerWitnessNic}
                      onChange={(e) => setOwnerWitnessNic(e.target.value)}
                      placeholder="Witness NIC"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Witness Residential Address</label>
                  <input
                    type="text"
                    value={ownerWitnessAddress}
                    onChange={(e) => setOwnerWitnessAddress(e.target.value)}
                    placeholder="Witness Address"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Witness Contact Number</label>
                    <input
                      type="text"
                      value={ownerWitnessContact}
                      onChange={(e) => setOwnerWitnessContact(e.target.value)}
                      placeholder="Phone / Mobile"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Witness Company / Occupation (Optional)</label>
                    <input
                      type="text"
                      value={ownerWitnessCompany}
                      onChange={(e) => setOwnerWitnessCompany(e.target.value)}
                      placeholder="Company name or Occupation"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 10 - Special Remarks */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Section 10 - Special Remarks / Specific Covenants (Optional)
                </label>
                <textarea
                  rows={3}
                  value={specialRemarks}
                  onChange={(e) => setSpecialRemarks(e.target.value)}
                  placeholder="e.g. Vehicle fitted with branded roof luggage rack; GPS tracker ID: TRK-9902; Special condition on fuel allowance, etc."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Navigation & Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              {activeTab !== 'parties' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'signatories') setActiveTab('financials')
                    else if (activeTab === 'financials') setActiveTab('term')
                    else if (activeTab === 'term') setActiveTab('parties')
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 transition-all"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>

              {activeTab !== 'signatories' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'parties') {
                      if (!selectedOwnerId) {
                        alert('Please select a Vehicle Owner')
                        return
                      }
                      if (selectedVehicleIds.length === 0) {
                        alert('Please select a Vehicle')
                        return
                      }
                      setActiveTab('term')
                    } else if (activeTab === 'term') {
                      setActiveTab('financials')
                    } else if (activeTab === 'financials') {
                      setActiveTab('signatories')
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black hover:bg-amber-300 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Creating Agreement...' : 'Generate Legal Owner Agreement'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

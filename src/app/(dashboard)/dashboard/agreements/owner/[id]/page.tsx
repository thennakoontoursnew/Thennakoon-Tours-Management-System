import { createClient } from '@/lib/supabase/server'
import { getOwnerAgreementById } from '@/lib/agreements/agreement-service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Printer,
  ArrowLeft,
  Car,
  ShieldCheck,
  DollarSign,
  Calendar,
  Building,
  UserCheck,
  Clock,
  Gauge,
  Wrench,
  AlertCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Owner Agreement Details — Thennakoon Tours',
}

export default async function OwnerAgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const data = await getOwnerAgreementById(supabase, id)
  if (!data || !data.agreement) {
    notFound()
  }

  const { agreement, payouts, statements } = data
  const owner = agreement.owner
  const vehicles = agreement.vehicles || []
  const agreementData = agreement.agreement_data || {}

  // Extract structured values with fallbacks
  const termDuration = agreementData.term_duration || '01 MONTH'
  const executionDate = agreementData.execution_date_formatted || agreementData.execution_date || agreement.activated_at || agreement.created_at
  const handoverDate = agreementData.handover_date_formatted || agreementData.handover_date || agreement.agreement_start_date
  const startDate = agreementData.start_date_formatted || agreement.agreement_start_date
  const endDate = agreementData.end_date_formatted || agreement.agreement_end_date || 'Open-ended'

  const rawRental = agreementData.financials?.monthly_rental ?? agreement.fixed_monthly_amount ?? 350000
  const monthlyRentalNum = typeof rawRental === 'number' ? rawRental : Number(String(rawRental).replace(/[^0-9.]/g, '')) || 350000
  const monthlyQuotaKm = agreementData.financials?.monthly_mileage_quota_km || 3000
  const excessMileageRate = agreementData.financials?.excess_mileage_rate_per_km || 117
  const serviceIntervalKm = agreementData.financials?.service_interval_km || 5000
  const paymentDay = agreementData.financials?.payment_day_of_month || '30th'
  const renewalCharge = agreementData.financials?.renewal_charge || 3000

  const bankAccHolder = agreementData.bank_details?.account_holder_name || owner?.full_name || 'N/A'
  const bankName = agreementData.bank_details?.bank_name || owner?.bank_name || 'N/A'
  const bankBranch = agreementData.bank_details?.bank_branch || owner?.bank_branch || 'N/A'
  const bankAccountNo = agreementData.bank_details?.bank_account_number || owner?.bank_account_number || 'N/A'

  const companyRepName = agreementData.signatories?.company_rep_name || 'HBNK Dissanayaka'
  const companyRepDesignation = agreementData.signatories?.company_rep_designation || 'Technical Officer'
  const companyRepNic = agreementData.signatories?.company_rep_nic || '881843935V'

  const ownerWitnessName = agreementData.signatories?.owner_witness_name
  const companyWitnessName = agreementData.signatories?.company_witness_name

  const specialRemarks = agreementData.special_remarks || agreement.special_conditions

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-4 py-6 md:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agreements"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-500 text-lg">{agreement.agreement_number}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  agreement.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-200'
                }`}
              >
                {agreement.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {termDuration}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Vehicle Owner Agreement — {owner?.full_name || 'Vehicle Owner'}
            </h1>
          </div>
        </div>

        <Link
          href={`/dashboard/agreements/owner/${id}/preview`}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1.5 shrink-0 w-fit"
        >
          <Printer size={15} />
          <span>View & Print Official Legal Agreement (PDF)</span>
        </Link>
      </div>

      {/* Grid: Agreement Core Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Owner Info Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Vehicle Owner</span>
          <div className="font-bold text-slate-900 dark:text-white text-sm">{owner?.full_name || 'N/A'}</div>
          <div className="text-xs text-slate-500">
            NIC: <span className="font-mono font-semibold">{owner?.national_id || agreementData.owner?.national_id || 'N/A'}</span>
          </div>
          <div className="text-xs text-slate-500">Mobile: {owner?.mobile || agreementData.owner?.phone || 'N/A'}</div>
          <div className="text-[11px] text-slate-400 truncate">
            {agreementData.owner?.address || owner?.address || 'No registered address'}
          </div>
        </div>

        {/* Commercial Payment Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Commercial Rental Terms</span>
          <div className="font-mono font-black text-amber-500 text-lg">
            Rs. {monthlyRentalNum.toLocaleString()}/-
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold space-y-0.5">
            <div>Monthly Quota: <span className="text-slate-900 dark:text-white font-bold">{monthlyQuotaKm.toLocaleString()} Km</span></div>
            <div>Excess Rate: <span className="text-slate-900 dark:text-white font-bold">Rs. {excessMileageRate}/= per Km</span></div>
            <div>Payout Day: <span className="text-slate-900 dark:text-white font-bold">{paymentDay} of month</span></div>
          </div>
        </div>

        {/* Validity Period Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Agreement Period & Term</span>
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            {termDuration}
          </div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
            {startDate} → {endDate}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Handover: <span className="font-mono font-medium">{handoverDate}</span></div>
            <div>Notice: {agreement.termination_notice_days || 30} Days prior notice</div>
          </div>
        </div>
      </div>

      {/* Covered Vehicles & Technical Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Car size={16} className="text-amber-500" /> Leased Vehicle Particulars (Clause 4 & Schedule)
        </h2>

        {vehicles.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No specific vehicle linked in database.</div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((item: any) => {
              const v = item.vehicle || {}
              const chassis = agreementData.vehicle?.chassis_number || v.chassis_number || 'N/A'
              const engine = agreementData.vehicle?.engine_number || v.engine_number || 'N/A'
              const mileage = agreementData.vehicle?.current_mileage || v.current_mileage

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {v.registration_number || agreementData.vehicle?.registration_number}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {v.brand} {v.model || v.vehicle_name || agreementData.vehicle?.make_model}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                      <div>Chassis: {chassis}</div>
                      <div>Engine: {engine}</div>
                      {mileage && <div>Odometer: {Number(mileage).toLocaleString()} Km</div>}
                    </div>
                  </div>

                  {v.id && (
                    <Link
                      href={`/dashboard/vehicles/${v.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs shrink-0 w-fit transition-colors"
                    >
                      View Vehicle Record
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Operational Responsibilities, Servicing & Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service & Operational Responsibilities */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Wrench size={15} className="text-amber-500" /> Servicing & Responsibilities
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Service Interval Mileage:</span>
              <span className="font-bold text-slate-900 dark:text-white">Every {serviceIntervalKm.toLocaleString()} Km</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Routine Service Cost:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{agreement.maintenance_responsibility || 'Vehicle Owner'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Commercial Insurance:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{agreement.insurance_responsibility || 'Vehicle Owner'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Major Mechanical Repairs:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{agreement.repair_responsibility || 'Vehicle Owner'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Agreement Renewal Fee:</span>
              <span className="font-bold text-slate-900 dark:text-white">Rs. {renewalCharge.toLocaleString()}/-</span>
            </div>
          </div>
        </div>

        {/* Remittance Bank Account */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Building size={15} className="text-amber-500" /> Owner Remittance Bank Account
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Account Holder:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bankAccHolder}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bankName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500">Branch:</span>
              <span className="font-bold text-slate-900 dark:text-white">{bankBranch}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Account Number:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{bankAccountNo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signatories & Special Remarks */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <UserCheck size={15} className="text-amber-500" /> Signatories & Legal Execution
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Company Representative</span>
            <div className="font-bold text-slate-900 dark:text-white">{companyRepName} ({companyRepDesignation})</div>
            <div className="text-[11px] text-slate-500 font-mono">NIC: {companyRepNic}</div>
            {companyWitnessName && <div className="text-[11px] text-slate-400">Witness: {companyWitnessName}</div>}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Vehicle Owner Signatory</span>
            <div className="font-bold text-slate-900 dark:text-white">{owner?.full_name || 'Owner'}</div>
            <div className="text-[11px] text-slate-500 font-mono">NIC: {owner?.national_id || 'N/A'}</div>
            {ownerWitnessName && <div className="text-[11px] text-slate-400">Witness: {ownerWitnessName}</div>}
          </div>
        </div>

        {specialRemarks && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Section 10 - Special Remarks / Specific Covenants
            </span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {specialRemarks}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

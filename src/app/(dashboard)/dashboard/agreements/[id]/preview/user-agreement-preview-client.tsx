'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Printer,
  Edit3,
  History,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import {
  USER_AGREEMENT_PREAMBLE,
  USER_AGREEMENT_CLAUSES,
  USER_AGREEMENT_SCHEDULE_TITLE,
  USER_AGREEMENT_DECLARATION,
  USER_AGREEMENT_COMPANY_REG_NO,
  USER_AGREEMENT_VERSION,
} from '@/lib/agreements/templates/user-agreement-v1'
import { UserAgreementFormData, validateUserAgreementData } from '@/lib/agreements/user-agreement-service'
import { amendUserAgreementAction } from '@/app/(dashboard)/dashboard/agreements/user-agreement-actions'

interface UserAgreementPreviewClientProps {
  agreement: any
  isV1: boolean
  booking?: any
  customer?: any
  vehicle?: any
  companySettings?: any
  versionHistory?: any[]
}

function formatDateSafe(val: any): string {
  if (!val) return '........................'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return '........................'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (_) {
    return '........................'
  }
}

function formatDateLegal(val: any): string {
  if (!val) return '........................'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return '........................'
    const day = d.getDate()
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const month = months[d.getMonth()]
    const year = d.getFullYear()

    let suffix = 'th'
    if (day % 10 === 1 && day !== 11) suffix = 'st'
    else if (day % 10 === 2 && day !== 12) suffix = 'nd'
    else if (day % 10 === 3 && day !== 13) suffix = 'rd'

    return `${day}${suffix} day of ${month} ${year}`
  } catch {
    return '........................'
  }
}

function formatNumberSafe(val: any): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function UserAgreementPreviewClient({
  agreement,
  isV1,
  booking,
  customer,
  vehicle,
  companySettings,
  versionHistory = [],
}: UserAgreementPreviewClientProps) {
  const router = useRouter()
  const [showAmendModal, setShowAmendModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<any>(null)

  const activeAgreementData = selectedVersion
    ? {
        ...agreement,
        version_number: selectedVersion.version_number,
        lessee_snapshot: selectedVersion.lessee_snapshot || agreement.lessee_snapshot,
        vehicle_snapshot: selectedVersion.vehicle_snapshot || agreement.vehicle_snapshot,
        rental_snapshot: selectedVersion.rental_snapshot || agreement.rental_snapshot,
        agreement_variables_snapshot: selectedVersion.agreement_variables_snapshot || agreement.agreement_variables_snapshot,
        nominated_drivers_snapshot: selectedVersion.nominated_drivers_snapshot || agreement.nominated_drivers_snapshot,
        witnesses_snapshot: selectedVersion.witnesses_snapshot || agreement.witnesses_snapshot,
        lessor_representative_snapshot: selectedVersion.lessor_representative_snapshot || agreement.lessor_representative_snapshot,
        special_notes: selectedVersion.special_notes ?? agreement.special_notes,
      }
    : agreement

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.open(`/print/user-agreement/${activeAgreementData.id}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Print CSS hiding ALL application UI chrome */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 14in portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print,
          .app-shell-ui {
            display: none !important;
          }
        }
      `}</style>

      {/* APPLICATION PREVIEW SHELL (EXCLUDED FROM PRINT / PDF) */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 print:hidden no-print app-shell-ui">
        <Link
          href="/dashboard/agreements"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
        >
          ← Back to Agreements Center
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{activeAgreementData.agreement_number}</span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
            Revision {activeAgreementData.version_number || 1}
          </span>
          {selectedVersion && (
            <button
              onClick={() => setSelectedVersion(null)}
              className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 cursor-pointer"
            >
              Viewing Historical Revision {selectedVersion.version_number} (Click for Latest)
            </button>
          )}

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <History size={14} />
            <span>Version History ({versionHistory.length || 1})</span>
          </button>

          {!selectedVersion && (
            <button
              onClick={() => setShowAmendModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Edit / Amend Agreement</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* PURE DOCUMENT CONTENT CONTAINER (EXCLUSIVELY EXPORTED TO PRINT / PDF) */}
      <UserAgreementDocument
        agreement={activeAgreementData}
        isV1={isV1}
        booking={booking}
        customer={customer}
        vehicle={vehicle}
        companySettings={companySettings}
      />

      {/* AMENDMENT MODAL */}
      {showAmendModal && (
        <AmendAgreementModal
          agreement={agreement}
          onClose={() => setShowAmendModal(false)}
          onSuccess={() => {
            setShowAmendModal(false)
            router.refresh()
          }}
        />
      )}

      {/* VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <VersionHistoryModal
          agreement={agreement}
          versionHistory={versionHistory}
          currentVersionNum={activeAgreementData.version_number || 1}
          onSelectVersion={(v) => {
            setSelectedVersion(v)
            setShowHistoryModal(false)
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  )
}

export function UserAgreementDocument({
  agreement,
  isV1,
  booking,
  customer,
  vehicle,
  companySettings,
}: {
  agreement: any
  isV1: boolean
  booking?: any
  customer?: any
  vehicle?: any
  companySettings?: any
}) {
  return (
    <div className="relative w-full max-w-[215.9mm] min-h-[355.6mm] bg-white text-slate-950 shadow-2xl rounded-none p-12 md:p-16 space-y-6 text-xs leading-relaxed print:p-0 print:shadow-none print:w-full font-serif sm:font-sans">
      {/* Formal Document Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-950 pb-3 mb-6">
        <div>
          <h1 className="text-base font-black uppercase tracking-wider text-slate-950">THENNAKOON TOURS (PVT) LTD</h1>
          <p className="text-[10px] text-slate-800">39A, 1st cross street, Pagoda Road, Nugegoda | Reg No. <span className="font-bold text-slate-950">{USER_AGREEMENT_COMPANY_REG_NO}</span></p>
          <p className="text-[10px] text-slate-800">Phone: +94 112 823 723 / +94 77 727 3820 | info@thennakoontours.lk</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-black text-slate-950 uppercase">VEHICLE RENTAL AGREEMENT</h2>
          <p className="text-xs font-mono font-bold text-slate-950">{agreement.agreement_number}</p>
        </div>
      </div>

      {isV1 ? (
        <V1UserAgreementContent agreement={agreement} customer={customer} vehicle={vehicle} />
      ) : (
        <LegacyUserAgreementContent agreement={agreement} booking={booking} customer={customer} vehicle={vehicle} companySettings={companySettings} />
      )}

      {/* Dynamic Footer */}
      <div className="pt-8 border-t border-slate-300 text-center text-[10px] text-slate-600 flex items-center justify-between font-mono">
        <span>Agreement Ref: {agreement.agreement_number}</span>
        <span>Thennakoon Tours (Pvt) Ltd (Reg No. {USER_AGREEMENT_COMPANY_REG_NO})</span>
      </div>
    </div>
  )
}

function V1UserAgreementContent({ agreement, customer, vehicle }: any) {
  const lessee = agreement.lessee_snapshot || customer || {}
  const veh = agreement.vehicle_snapshot || vehicle || {}
  const rental = agreement.rental_snapshot || {}
  const variables = agreement.agreement_variables_snapshot || {}
  const drivers = agreement.nominated_drivers_snapshot || []
  const witnesses = agreement.witnesses_snapshot || {}
  const lessorRep = agreement.lessor_representative_snapshot || {}

  const lesseeName = lessee.company_name || lessee.full_name || 'Lessee'
  const lesseeId = lessee.nic || lessee.identifier_no || lessee.passport_number || '........................'
  const lesseeAddr = lessee.address || lessee.address_line_1 || 'Sri Lanka'

  const replaceTokens = (str: string) => {
    if (!str) return ''
    const rentalStart = formatDateLegal(agreement.rental_start_at)
    const rentalEnd = formatDateLegal(agreement.rental_end_at)
    const rentalPeriod = String(rental.rental_period_days || 30)
    const rentalAmount = formatNumberSafe(rental.monthly_rental_rate || rental.daily_rental_rate || 7500)
    const dueDateDay = String(variables.due_date_day || '1st')
    const extraKmRate = String(rental.extra_km_rate || 75)
    const minorAccidentThreshold = formatNumberSafe(variables.minor_accident_threshold || 25000)

    return str
      .replace(/{{AGREEMENT_NUMBER}}/g, agreement.agreement_number || 'N/A')
      .replace(/{{AGREEMENT_DATE}}/g, agreement.agreement_date || formatDateLegal(new Date()))
      .replace(/{{RENTAL_START}}/g, rentalStart)
      .replace(/{{RENTAL_END}}/g, rentalEnd)
      .replace(/{{RENTAL_PERIOD_DAYS}}/g, rentalPeriod)
      .replace(/{{MONTHLY_OR_DAILY_RENTAL}}/g, rentalAmount)
      .replace(/{{DUE_DATE_DAY}}/g, dueDateDay)
      .replace(/{{LESSEE_FULL_NAME}}/g, lesseeName)
      .replace(/{{LESSEE_IDENTIFIER_NO}}/g, lesseeId)
      .replace(/{{EXTRA_KM_RATE}}/g, extraKmRate)
      .replace(/{{MINOR_ACCIDENT_THRESHOLD}}/g, minorAccidentThreshold)
      // Source placeholder variations
      .replace(/\(FULL NAME OF USER\)/gi, lesseeName)
      .replace(/\(USER FULL ADDRESS\)/gi, lesseeAddr)
      .replace(/\(Name of the Lessee\)/gi, lesseeName)
      .replace(/\(RENTAL STARTING DATE AND YEAR\)/gi, rentalStart)
      .replace(/\(PERIOD\)/gi, `${rentalPeriod} days`)
      .replace(/\(RENTAL AMAOUNT\)/gi, `LKR ${rentalAmount}`)
      .replace(/\(RENTAL DATE ONLY\)/gi, dueDateDay)
  }

  return (
    <div className="space-y-6">
      {/* PREAMBLE */}
      <div className="p-4 border border-slate-300 bg-white whitespace-pre-wrap text-xs leading-relaxed text-justify text-slate-950">
        {replaceTokens(USER_AGREEMENT_PREAMBLE)}
      </div>

      {/* LEGAL CLAUSES 1 to 18 */}
      <div className="space-y-5">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-950 border-b-2 border-slate-950 pb-1">
          TERMS AND CONDITIONS OF HIRE
        </h2>
        {USER_AGREEMENT_CLAUSES.map((clause) => (
          <div key={clause.number} className="space-y-1.5 text-xs">
            <h3 className="font-bold text-slate-950 uppercase">{clause.number}. {clause.title}</h3>
            <div className="whitespace-pre-wrap text-slate-950 pl-3 border-l-2 border-slate-300 leading-relaxed text-justify">
              {replaceTokens(clause.content)}
            </div>
          </div>
        ))}
      </div>

      {/* SHEDULE TO AGREEMENT (Preserving exact spelling) */}
      <div className="pt-6 space-y-4 break-inside-avoid page-break-inside-avoid">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-950 border-b-2 border-slate-950 pb-1 text-center">
          {USER_AGREEMENT_SCHEDULE_TITLE}
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-slate-950 p-4 text-xs">
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Lessee Name & Surname:</span>
            <span className="font-bold text-right">{lesseeName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Passport Number:</span>
            <span className="font-mono text-right">{lessee.passport_number || '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">I.D. number:</span>
            <span className="font-mono font-bold text-right">{lesseeId}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Mobile number:</span>
            <span className="text-right">{lessee.mobile || '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Fixed Line/Relative:</span>
            <span className="text-right">{lessee.fixed_line || lessee.relative_contact || '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">E-mail address:</span>
            <span className="text-right">{lessee.email || '........................'}</span>
          </div>
          <div className="col-span-2 flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Registered post address:</span>
            <span className="text-right">{lesseeAddr}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Driving license Number:</span>
            <span className="font-mono font-bold text-right">{lessee.driving_license_number || '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">License & Insurance of vehicle:</span>
            <span className="italic text-slate-700 text-right">Received at delivery, Signature...........</span>
          </div>

          <div className="col-span-2 border-t-2 border-slate-950 my-2 pt-2 font-black text-slate-950 uppercase text-center tracking-wide">
            Vehicle & Rental Details
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Make & Model:</span>
            <span className="font-bold text-right">{veh.make_model || veh.vehicle_name || 'Toyota Axio'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Registration No:</span>
            <span className="font-mono font-bold text-slate-950 text-right">{veh.registration_number || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Color:</span>
            <span className="text-right">{veh.color || 'White'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Fuel Type:</span>
            <span className="text-right">{veh.fuel_type || 'Petrol'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Odometer Reading:</span>
            <span className="font-mono text-right">{veh.pickup_odometer || 0} KM</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Period:</span>
            <span className="text-right">{formatDateSafe(agreement.rental_start_at)} to {formatDateSafe(agreement.rental_end_at)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Monthly Rental:</span>
            <span className="font-mono text-right">LKR {formatNumberSafe(rental.monthly_rental_rate || 0)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Daily Rental Fee:</span>
            <span className="font-mono text-right">LKR {formatNumberSafe(rental.daily_rental_rate || 7500)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Security Deposit:</span>
            <span className="font-mono text-right">LKR {formatNumberSafe(rental.security_deposit || 50000)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Extra Mileage Fee:</span>
            <span className="font-mono text-right">Rs {rental.extra_km_rate || 75}/=</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Deliver Fee:</span>
            <span className="text-right">To: {rental.delivery_fee ? `LKR ${formatNumberSafe(rental.delivery_fee)}` : '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Pick up fee:</span>
            <span className="text-right">From (8.am to 6.P.M): {rental.pickup_fee ? `LKR ${formatNumberSafe(rental.pickup_fee)}` : '........................'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Advance:</span>
            <span className="font-mono text-right">LKR {formatNumberSafe(rental.advance_paid || 0)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Time:</span>
            <span className="text-right">09:00 AM</span>
          </div>
          <div className="col-span-2 flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Inventory Remarks:</span>
            <span className="text-right">{agreement.inventory_remarks || 'Refer delivery and return note'}</span>
          </div>
          <div className="col-span-2 flex justify-between border-b border-slate-200 pb-1">
            <span className="font-bold text-slate-950">Special Note:</span>
            <span className="text-right">{agreement.special_notes || '........................'}</span>
          </div>
        </div>
      </div>

      {/* NOMINATED DRIVER DETAILS */}
      <div className="pt-4 space-y-2 break-inside-avoid page-break-inside-avoid">
        <p className="text-xs text-slate-950 leading-relaxed font-bold">
          The Details of the Nominated Drivers by the Lessee in terms of above explained clause 5 (b) comes under the heading of use of vehicle.
        </p>
        <table className="w-full text-left text-xs border border-slate-950">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-950">
              <th className="p-2 border-r border-slate-950">Driver Name</th>
              <th className="p-2 border-r border-slate-950">Driving license Number</th>
              <th className="p-2">Mobile</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((d: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="p-2 font-bold border-r border-slate-300">{d.name}</td>
                  <td className="p-2 font-mono border-r border-slate-300">{d.license_number || '........................'}</td>
                  <td className="p-2">{d.mobile || '........................'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="p-2 text-slate-700 italic border-t border-slate-300">Self Drive by Lessee.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LESSEE DECLARATION */}
      <div className="pt-4 space-y-2 break-inside-avoid page-break-inside-avoid">
        <div className="p-4 border border-slate-950 bg-white text-xs text-slate-950 leading-relaxed">
          {replaceTokens(USER_AGREEMENT_DECLARATION)}
        </div>
      </div>

      {/* LESSOR / LESSEE SIGNATURE SECTION */}
      <div className="pt-10 grid grid-cols-2 gap-12 text-xs break-inside-avoid page-break-inside-avoid">
        <div className="border-t border-slate-950 pt-2 space-y-1">
          <p className="font-bold text-slate-950 uppercase">The Lessor/ on behalf of the Lessor</p>
          <p className="text-slate-800">NIC: {lessorRep.nic || '........................'}</p>
          <p className="text-slate-800">Name: {lessorRep.name || '........................'}</p>
          <p className="text-slate-800">Address: 39A, 1st cross street, Pagoda Road, Nugegoda, SriLanka.</p>
        </div>

        <div className="border-t border-slate-950 pt-2 space-y-1">
          <div className="flex justify-between font-bold text-slate-950">
            <span>The Lessee—Ol</span>
            <span>The Lessee----02</span>
          </div>
          <p className="text-slate-800">Name: {lesseeName}</p>
          <p className="text-slate-800">NIC/Passport: {lesseeId}</p>
          <p className="text-slate-800">Address: {lesseeAddr}</p>
        </div>
      </div>

      {/* WITNESSES SECTION */}
      <div className="pt-8 border-t border-slate-950 space-y-4 text-xs break-inside-avoid page-break-inside-avoid">
        <h3 className="font-bold text-slate-950 uppercase tracking-wide">In the Presence of:</h3>
        <div className="grid grid-cols-2 gap-12">
          <div className="border border-slate-950 p-4 space-y-1.5">
            <p className="font-bold text-slate-950 uppercase">Witness 1</p>
            <p>Signature: ........................................</p>
            <p>Name: {witnesses.witness_1?.name || '........................................'}</p>
            <p>Address: {witnesses.witness_1?.address || '........................................'}</p>
            <p>Mobile No: {witnesses.witness_1?.mobile || '........................................'}</p>
          </div>
          <div className="border border-slate-950 p-4 space-y-1.5">
            <p className="font-bold text-slate-950 uppercase">Witness 2</p>
            <p>Signature: ........................................</p>
            <p>Name: {witnesses.witness_2?.name || '........................................'}</p>
            <p>Address: {witnesses.witness_2?.address || '........................................'}</p>
            <p>Mobile No: {witnesses.witness_2?.mobile || '........................................'}</p>
          </div>
        </div>
        <p className="pt-4 text-slate-950 font-bold text-xs text-center">
          Sign before us on this {formatDateLegal(agreement.agreement_date || new Date())} at Nugegoda/Thennakoon Tours head office.
        </p>
      </div>
    </div>
  )
}

function LegacyUserAgreementContent({ agreement, booking, customer, vehicle, companySettings }: any) {
  const custName = customer?.full_name || 'Customer / Hirer'
  const custNic = customer?.nic || customer?.passport_number || 'N/A'
  const custMobile = customer?.mobile || 'N/A'
  const custAddress = customer?.address || customer?.address_line_1 || 'Sri Lanka'
  const vehName = vehicle?.vehicle_name || 'Allocated Vehicle'
  const vehReg = vehicle?.registration_number || 'N/A'
  const startDate = formatDateSafe(agreement.rental_start_at || booking?.rental_start_at || agreement.agreement_date)
  const endDate = formatDateSafe(agreement.rental_end_at || booking?.rental_end_at)
  const dailyRate = booking?.daily_rate || vehicle?.daily_rate || 7500
  const deposit = booking?.refundable_deposit || vehicle?.refundable_deposit || 50000
  const termsText = agreement.terms_snapshot || companySettings?.default_agreement_terms || '1. Hirer is responsible for vehicle during rental period. 2. Fuel level must match pickup level. 3. Vehicle must be returned on time.'

  return (
    <div className="space-y-6">
      <div className="border border-slate-950 p-4 space-y-3">
        <h3 className="font-bold text-slate-950 uppercase">1. HIRER / LESSEE DETAILS</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-slate-700 block">Full Name:</span><span className="font-bold">{custName}</span></div>
          <div><span className="text-slate-700 block">NIC / Passport:</span><span className="font-mono font-bold">{custNic}</span></div>
          <div><span className="text-slate-700 block">Mobile Phone:</span><span>{custMobile}</span></div>
          <div><span className="text-slate-700 block">Address:</span><span>{custAddress}</span></div>
        </div>
      </div>

      <div className="border border-slate-950 p-4 space-y-3">
        <h3 className="font-bold text-slate-950 uppercase">2. VEHICLE & RENTAL PERIOD</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-slate-700 block">Vehicle Name:</span><span className="font-bold">{vehName}</span></div>
          <div><span className="text-slate-700 block">Registration Number:</span><span className="font-mono font-bold text-slate-950">{vehReg}</span></div>
          <div><span className="text-slate-700 block">Rental Start Date:</span><span>{startDate}</span></div>
          <div><span className="text-slate-700 block">Rental End Date:</span><span>{endDate}</span></div>
          <div><span className="text-slate-700 block">Daily Tariff:</span><span className="font-mono">LKR {formatNumberSafe(dailyRate)}</span></div>
          <div><span className="text-slate-700 block">Security Deposit:</span><span className="font-mono">LKR {formatNumberSafe(deposit)}</span></div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-slate-950 uppercase">3. TERMS AND CONDITIONS</h3>
        <div className="p-4 border border-slate-950 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {termsText}
        </div>
      </div>

      <div className="pt-12 grid grid-cols-2 gap-12 text-xs">
        <div className="border-t border-slate-950 pt-2 text-center space-y-1"><p className="font-bold text-slate-950">HIRER SIGNATURE</p><p className="text-slate-800">{custName}</p></div>
        <div className="border-t border-slate-950 pt-2 text-center space-y-1"><p className="font-bold text-slate-950">FOR THENNAKOON TOURS (PVT) LTD</p><p className="text-slate-800">Authorized Officer</p></div>
      </div>
    </div>
  )
}

function AmendAgreementModal({
  agreement,
  onClose,
  onSuccess,
}: {
  agreement: any
  onClose: () => void
  onSuccess: () => void
}) {
  const isSignedOrActive = ['signed', 'active'].includes(agreement.status)
  const currentVersion = agreement.version_number || 1
  const nextVersion = currentVersion + 1

  const [amendmentReason, setAmendmentReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [lesseeName, setLesseeName] = useState(agreement.lessee_snapshot?.full_name || '')
  const [lesseeNic, setLesseeNic] = useState(agreement.lessee_snapshot?.identifier_no || '')
  const [lesseeMobile, setLesseeMobile] = useState(agreement.lessee_snapshot?.mobile || '')
  const [lesseeAddress, setLesseeAddress] = useState(agreement.lessee_snapshot?.address || '')

  const [vehMakeModel, setVehMakeModel] = useState(agreement.vehicle_snapshot?.make_model || '')
  const [vehRegNo, setVehRegNo] = useState(agreement.vehicle_snapshot?.registration_number || '')
  const [vehOdometer, setVehOdometer] = useState(agreement.vehicle_snapshot?.pickup_odometer || 0)

  const [dailyRate, setDailyRate] = useState(agreement.rental_snapshot?.daily_rental_rate || 7500)
  const [securityDeposit, setSecurityDeposit] = useState(agreement.rental_snapshot?.security_deposit || 50000)

  const [specialNotes, setSpecialNotes] = useState(agreement.special_notes || '')

  const handleSaveAmendment = async () => {
    if (!amendmentReason.trim()) {
      setError('Please provide a valid Amendment Reason before saving this revision.')
      return
    }

    setSaving(true)
    setError('')

    const formData: UserAgreementFormData = {
      agreement_number: agreement.agreement_number,
      booking_id: agreement.booking_id,
      customer_id: agreement.customer_id,
      template_version: USER_AGREEMENT_VERSION,
      agreement_date: agreement.agreement_date,
      rental_start_at: agreement.rental_start_at,
      rental_end_at: agreement.rental_end_at,
      rental_period_days: agreement.rental_snapshot?.rental_period_days || 30,
      lessee: {
        ...agreement.lessee_snapshot,
        full_name: lesseeName,
        identifier_no: lesseeNic,
        mobile: lesseeMobile,
        address: lesseeAddress,
      },
      vehicle: {
        ...agreement.vehicle_snapshot,
        make_model: vehMakeModel,
        registration_number: vehRegNo,
        pickup_odometer: Number(vehOdometer),
      },
      rental: {
        ...agreement.rental_snapshot,
        daily_rental_rate: Number(dailyRate),
        security_deposit: Number(securityDeposit),
      },
      nominated_drivers: agreement.nominated_drivers_snapshot || [],
      pickup_delivery: agreement.pickup_delivery_snapshot || { pickup_location: 'Nugegoda' },
      special_notes: specialNotes,
      inventory_remarks: agreement.inventory_remarks || 'Refer delivery note',
      lessor_representative: agreement.lessor_representative_snapshot || { name: 'Authorized Officer' },
      witnesses: agreement.witnesses_snapshot || { witness_1: {}, witness_2: {} },
      variables: agreement.agreement_variables_snapshot || {
        minor_repair_limit: 13500,
        insurance_excess: 15000,
        minor_accident_threshold: 25000,
        cleaning_fee: 1500,
        full_interior_cleaning_fee: 12000,
        additional_driver_fee: 5000,
        security_deposit_hold_days: 14,
        notice_period_days: 30,
        allowed_km_per_day: 100,
        third_party_insurance_cover: 500000,
        agreement_location: 'Nugegoda, Sri Lanka',
        company_hotline: '+94 112 823 723',
        company_bank_details: 'Nations Trust Bank - Nugegoda Branch, Account # 100530013140',
      },
    }

    try {
      const res = await amendUserAgreementAction(agreement.id, formData, amendmentReason)
      if (res.success) {
        alert(`Successfully saved User Agreement Revision ${res.versionNumber}!`)
        onSuccess()
      } else {
        setError(res.error || 'Failed to save amendment.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
            <h2 className="text-base font-bold text-white">Amend User Agreement Snapshot → Save Revision {nextVersion}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {isSignedOrActive && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-amber-400" />
            <span>
              <strong>Warning:</strong> This agreement is currently in status &quot;{agreement.status}&quot;. Saving this amendment will create Revision {nextVersion} without altering historical Revision {currentVersion}.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock size={14} className="text-emerald-400 shrink-0" />
            <span>Legal 18 Clauses, PV 00312253 company reg, and source-defined numeric limits remain locked and un-editable.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Lessee Full Name</label>
              <input
                value={lesseeName}
                onChange={(e) => setLesseeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Lessee NIC / Passport</label>
              <input
                value={lesseeNic}
                onChange={(e) => setLesseeNic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Mobile Phone</label>
              <input
                value={lesseeMobile}
                onChange={(e) => setLesseeMobile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Registered Address</label>
              <input
                value={lesseeAddress}
                onChange={(e) => setLesseeAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Vehicle Make & Model</label>
              <input
                value={vehMakeModel}
                onChange={(e) => setVehMakeModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Registration Number</label>
              <input
                value={vehRegNo}
                onChange={(e) => setVehRegNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Daily Rental Tariff (LKR)</label>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Security Deposit (LKR)</label>
              <input
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-300 block mb-1">Special Notes</label>
              <input
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="font-bold text-amber-400 block mb-1">Amendment Reason (Required) *</label>
            <textarea
              rows={2}
              placeholder="e.g. Corrected Lessee passport number and vehicle registration typo."
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-white font-semibold text-xs placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSaveAmendment}
            disabled={saving || !amendmentReason.trim()}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving ? 'Saving Revision...' : `Save Revision ${nextVersion}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function VersionHistoryModal({
  agreement,
  versionHistory = [],
  currentVersionNum,
  onSelectVersion,
  onClose,
}: {
  agreement: any
  versionHistory: any[]
  currentVersionNum: number
  onSelectVersion: (v: any) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 w-full max-w-xl rounded-2xl border border-slate-800 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
            <h2 className="text-base font-bold text-white">Agreement Version History</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {versionHistory.length > 0 ? (
            versionHistory.map((v: any) => {
              const isCurrent = v.version_number === currentVersionNum
              return (
                <div
                  key={v.id || v.version_number}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400">Revision {v.version_number}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">
                          Active Revision
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDateSafe(v.created_at)}</span>
                  </div>

                  <p className="text-slate-300 font-semibold">{v.amendment_reason || 'Initial Agreement Generated'}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>By: {v.creator?.full_name || 'System / Staff'}</span>
                    <button
                      onClick={() => onSelectVersion(v)}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold cursor-pointer"
                    >
                      View / Print Revision {v.version_number}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="font-mono text-amber-400">Revision 1 (Active)</span>
                <span className="text-[10px] font-mono">{formatDateSafe(agreement.created_at)}</span>
              </div>
              <p className="text-slate-300">Initial Agreement Generated (Revision 1)</p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

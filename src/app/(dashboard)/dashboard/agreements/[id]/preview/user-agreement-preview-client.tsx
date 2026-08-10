'use client'

import Link from 'next/link'
import {
  USER_AGREEMENT_PREAMBLE,
  USER_AGREEMENT_CLAUSES,
  USER_AGREEMENT_SCHEDULE_TITLE,
  USER_AGREEMENT_DECLARATION,
  USER_AGREEMENT_COMPANY_REG_NO,
} from '@/lib/agreements/templates/user-agreement-v1'

interface UserAgreementPreviewClientProps {
  agreement: any
  isV1: boolean
  booking?: any
  customer?: any
  vehicle?: any
  companySettings?: any
}

function formatDateSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (_) {
    return 'N/A'
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
}: UserAgreementPreviewClientProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Print CSS forcing US Legal 8.5 x 14 in portrait with NO LETTERHEAD */}
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
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden no-print">
        <Link href="/dashboard/agreements" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200">
          ← Back to Agreements Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            US LEGAL (8.5 × 14 in) — REG PV 00312253
          </span>
          <button onClick={handlePrint} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-xs">
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* CLEAN WHITE US LEGAL Paper Container: 215.9mm x 355.6mm (NO LETTERHEAD IMAGE) */}
      <div className="relative w-full max-w-[215.9mm] min-h-[355.6mm] bg-white text-slate-900 shadow-2xl rounded-sm p-12 md:p-16 space-y-6 text-xs leading-relaxed print:p-0 print:shadow-none print:w-full">
        {/* Formal Document Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-slate-900">THENNAKOON TOURS (PVT) LTD</h1>
            <p className="text-[10px] text-slate-600">39A, 1st cross street, Pagoda Road, Nugegoda | Reg No. <span className="font-bold text-slate-900">{USER_AGREEMENT_COMPANY_REG_NO}</span></p>
            <p className="text-[10px] text-slate-600">Phone: +94 112 823 723 / +94 77 727 3820 | info@thennakoontours.lk</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-black text-slate-900 uppercase">VEHICLE RENTAL AGREEMENT</h2>
            <p className="text-xs font-mono font-bold text-amber-700">{agreement.agreement_number}</p>
          </div>
        </div>

        {isV1 ? (
          <V1UserAgreementContent agreement={agreement} customer={customer} vehicle={vehicle} />
        ) : (
          <LegacyUserAgreementContent agreement={agreement} booking={booking} customer={customer} vehicle={vehicle} companySettings={companySettings} />
        )}

        {/* Dynamic Footer */}
        <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
          <span>Agreement Reference: {agreement.agreement_number}</span>
          <span>Thennakoon Tours (Pvt) Ltd (Reg No. {USER_AGREEMENT_COMPANY_REG_NO})</span>
          <span>Page Document</span>
        </div>
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

  const replaceTokens = (str: string) => {
    if (!str) return ''
    return str
      .replace(/{{AGREEMENT_NUMBER}}/g, agreement.agreement_number || 'N/A')
      .replace(/{{AGREEMENT_DATE}}/g, agreement.agreement_date || formatDateSafe(new Date()))
      .replace(/{{RENTAL_START}}/g, formatDateSafe(agreement.rental_start_at))
      .replace(/{{RENTAL_END}}/g, formatDateSafe(agreement.rental_end_at))
      .replace(/{{RENTAL_PERIOD_DAYS}}/g, String(rental.rental_period_days || 30))
      .replace(/{{MONTHLY_OR_DAILY_RENTAL}}/g, formatNumberSafe(rental.monthly_rental_rate || rental.daily_rental_rate || 7500))
      .replace(/{{DUE_DATE_DAY}}/g, String(variables.due_date_day || '1st'))
      .replace(/{{LESSEE_FULL_NAME}}/g, lessee.full_name || 'Lessee')
      .replace(/{{LESSEE_IDENTIFIER_NO}}/g, lessee.identifier_no || lessee.nic || lessee.passport_number || 'N/A')
      .replace(/{{EXTRA_KM_RATE}}/g, String(rental.extra_km_rate || 75))
      .replace(/{{MINOR_ACCIDENT_THRESHOLD}}/g, formatNumberSafe(variables.minor_accident_threshold || 25000))
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 rounded border border-slate-200 whitespace-pre-wrap text-[11px] leading-relaxed">
        {replaceTokens(USER_AGREEMENT_PREAMBLE)}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
          TERMS AND CONDITIONS OF HIRE
        </h2>
        {USER_AGREEMENT_CLAUSES.map((clause) => (
          <div key={clause.number} className="space-y-1 text-[11px]">
            <h3 className="font-bold text-slate-900">{clause.number}. {clause.title}</h3>
            <div className="whitespace-pre-wrap text-slate-800 pl-3 border-l-2 border-slate-200 leading-relaxed">
              {replaceTokens(clause.content)}
            </div>
          </div>
        ))}
      </div>

      {/* SHEDULE TO AGREEMENT (Preserving exact spelling) */}
      <div className="pt-6 space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
          {USER_AGREEMENT_SCHEDULE_TITLE}
        </h2>
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded border border-slate-200 text-[11px]">
          <div><span className="font-bold text-slate-500 block">Lessee Name & Surname:</span><span className="font-bold">{lessee.full_name || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Passport Number:</span><span className="font-mono">{lessee.passport_number || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">I.D. number:</span><span className="font-mono font-bold">{lessee.nic || lessee.identifier_no || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Mobile number:</span><span>{lessee.mobile || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Fixed Line/Relative:</span><span>{lessee.fixed_line || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">E-mail address:</span><span>{lessee.email || 'N/A'}</span></div>
          <div className="col-span-2"><span className="font-bold text-slate-500 block">Registered post address:</span><span>{lessee.address || 'Sri Lanka'}</span></div>
          <div><span className="font-bold text-slate-500 block">Driving license Number:</span><span className="font-mono font-bold">{lessee.driving_license_number || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">License & Insurance of vehicle:</span><span className="italic text-slate-600">Received at delivery, Signature...........</span></div>

          <div className="col-span-2 border-t border-slate-200 my-1 pt-2 font-bold text-slate-700 uppercase">Vehicle & Rental Details</div>

          <div><span className="font-bold text-slate-500 block">Make & Model:</span><span className="font-bold">{veh.make_model || veh.vehicle_name || 'Toyota Axio'}</span></div>
          <div><span className="font-bold text-slate-500 block">Registration No:</span><span className="font-mono font-bold text-amber-700">{veh.registration_number || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Color:</span><span>{veh.color || 'White'}</span></div>
          <div><span className="font-bold text-slate-500 block">Fuel Type:</span><span>{veh.fuel_type || 'Petrol'}</span></div>
          <div><span className="font-bold text-slate-500 block">Odometer Reading:</span><span className="font-mono">{veh.pickup_odometer || 0} KM</span></div>
          <div><span className="font-bold text-slate-500 block">Period:</span><span>{formatDateSafe(agreement.rental_start_at)} to {formatDateSafe(agreement.rental_end_at)}</span></div>
          <div><span className="font-bold text-slate-500 block">Monthly Rental:</span><span className="font-mono">LKR {formatNumberSafe(rental.monthly_rental_rate || 0)}</span></div>
          <div><span className="font-bold text-slate-500 block">Daily Rental Fee:</span><span className="font-mono">LKR {formatNumberSafe(rental.daily_rental_rate || 7500)}</span></div>
          <div><span className="font-bold text-slate-500 block">Security Deposit:</span><span className="font-mono">LKR {formatNumberSafe(rental.security_deposit || 50000)}</span></div>
          <div><span className="font-bold text-slate-500 block">Extra Mileage Fee:</span><span className="font-mono">Rs {rental.extra_km_rate || 75}/=</span></div>
          <div><span className="font-bold text-slate-500 block">Deliver Fee:</span><span>To: {rental.delivery_fee ? `LKR ${formatNumberSafe(rental.delivery_fee)}` : 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Pick up fee:</span><span>From (8.am to 6.P.M): {rental.pickup_fee ? `LKR ${formatNumberSafe(rental.pickup_fee)}` : 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Advance:</span><span className="font-mono">LKR {formatNumberSafe(rental.advance_paid || 0)}</span></div>
          <div><span className="font-bold text-slate-500 block">Time:</span><span>09:00 AM</span></div>
          <div className="col-span-2"><span className="font-bold text-slate-500 block">Inventory Remarks:</span><span>Refer delivery and return note</span></div>
          <div className="col-span-2"><span className="font-bold text-slate-500 block">Special Note:</span><span>{agreement.special_notes || ''}</span></div>
        </div>
      </div>

      {/* NOMINATED DRIVER DETAILS */}
      <div className="pt-4 space-y-2">
        <p className="text-[11px] text-slate-800 leading-relaxed font-bold">
          The Details of the Nominated Drivers by the Lessee in terms of above explained clause 5 (b) comes under the heading of use of vehicle.
        </p>
        <table className="w-full text-left text-[11px] border border-slate-200">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-200">
              <th className="p-2">Driver Name</th>
              <th className="p-2">Driving license Number</th>
              <th className="p-2">Mobile</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((d: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="p-2 font-bold">{d.name}</td>
                  <td className="p-2 font-mono">{d.license_number}</td>
                  <td className="p-2">{d.mobile}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="p-2 text-slate-400 italic">Self Drive by Lessee.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LESSEE DECLARATION */}
      <div className="pt-4 space-y-2">
        <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] font-mono text-amber-900 leading-relaxed">
          {replaceTokens(USER_AGREEMENT_DECLARATION)}
        </div>
      </div>

      {/* LESSOR / LESSEE SIGNATURE SECTION */}
      <div className="pt-10 grid grid-cols-2 gap-12 text-[11px]">
        <div className="border-t border-slate-400 pt-2 space-y-1">
          <p className="font-bold text-slate-900 uppercase">The Lessor/ on behalf of the Lessor</p>
          <p className="text-slate-600">NIC: {lessorRep.nic || '........................'}</p>
          <p className="text-slate-600">Name: {lessorRep.name || '........................'}</p>
          <p className="text-slate-600">Address: 39A, 1st cross street, Pagoda Road, Nugegoda, SriLanka.</p>
        </div>

        <div className="border-t border-slate-400 pt-2 space-y-1">
          <div className="flex justify-between font-bold text-slate-900">
            <span>The Lessee—Ol</span>
            <span>The Lessee----02</span>
          </div>
          <p className="text-slate-600">Name: {lessee.full_name}</p>
          <p className="text-slate-600">NIC/Passport: {lessee.identifier_no || lessee.nic || 'N/A'}</p>
          <p className="text-slate-600">Address: {lessee.address || 'Sri Lanka'}</p>
        </div>
      </div>

      {/* WITNESSES SECTION */}
      <div className="pt-8 border-t border-slate-300 space-y-3 text-[11px]">
        <h3 className="font-bold text-slate-900 uppercase">In the Presence of:</h3>
        <div className="grid grid-cols-2 gap-12">
          <div className="border border-slate-200 p-3 rounded space-y-1">
            <p className="font-bold text-slate-800">Witness 1</p>
            <p>Signature: ........................</p>
            <p>Name: {witnesses.witness_1?.name || '........................'}</p>
            <p>Address: {witnesses.witness_1?.address || '........................'}</p>
            <p>Mobile No: {witnesses.witness_1?.mobile || '........................'}</p>
          </div>
          <div className="border border-slate-200 p-3 rounded space-y-1">
            <p className="font-bold text-slate-800">Witness 2</p>
            <p>Signature: ........................</p>
            <p>Name: {witnesses.witness_2?.name || '........................'}</p>
            <p>Address: {witnesses.witness_2?.address || '........................'}</p>
            <p>Mobile No: {witnesses.witness_2?.mobile || '........................'}</p>
          </div>
        </div>
        <p className="pt-2 text-slate-600 font-mono text-[10px] text-center">
          Sign before us on this................................ at Nugegoda/Thennakoon Tours head office.
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
      <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 uppercase">1. HIRER / LESSEE DETAILS</h3>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div><span className="text-slate-500 block">Full Name:</span><span className="font-bold">{custName}</span></div>
          <div><span className="text-slate-500 block">NIC / Passport:</span><span className="font-mono font-bold">{custNic}</span></div>
          <div><span className="text-slate-500 block">Mobile Phone:</span><span>{custMobile}</span></div>
          <div><span className="text-slate-500 block">Address:</span><span>{custAddress}</span></div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 uppercase">2. VEHICLE & RENTAL PERIOD</h3>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div><span className="text-slate-500 block">Vehicle Name:</span><span className="font-bold">{vehName}</span></div>
          <div><span className="text-slate-500 block">Registration Number:</span><span className="font-mono font-bold text-amber-700">{vehReg}</span></div>
          <div><span className="text-slate-500 block">Rental Start Date:</span><span>{startDate}</span></div>
          <div><span className="text-slate-500 block">Rental End Date:</span><span>{endDate}</span></div>
          <div><span className="text-slate-500 block">Daily Tariff:</span><span className="font-mono">LKR {formatNumberSafe(dailyRate)}</span></div>
          <div><span className="text-slate-500 block">Security Deposit:</span><span className="font-mono">LKR {formatNumberSafe(deposit)}</span></div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-slate-900 uppercase">3. TERMS AND CONDITIONS</h3>
        <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
          {termsText}
        </div>
      </div>

      <div className="pt-12 grid grid-cols-2 gap-12 text-[11px]">
        <div className="border-t border-slate-400 pt-2 text-center space-y-1"><p className="font-bold text-slate-900">HIRER SIGNATURE</p><p className="text-slate-600">{custName}</p></div>
        <div className="border-t border-slate-400 pt-2 text-center space-y-1"><p className="font-bold text-slate-900">FOR THENNAKOON TOURS (PVT) LTD</p><p className="text-slate-600">Authorized Officer</p></div>
      </div>
    </div>
  )
}

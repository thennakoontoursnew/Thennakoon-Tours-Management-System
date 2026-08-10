'use client'

import Link from 'next/link'
import {
  USER_AGREEMENT_PREAMBLE,
  USER_AGREEMENT_CLAUSES,
  USER_AGREEMENT_DECLARATION,
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
      {/* Print CSS forcing US Legal 8.5 x 14 in portrait */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 14in portrait;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard/agreements" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200">
          ← Back to Agreements Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            US LEGAL (8.5 × 14 in)
          </span>
          <button onClick={handlePrint} className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-xs">
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* US LEGAL Paper Container: 215.9mm x 355.6mm */}
      <div className="relative w-full max-w-[215.9mm] min-h-[355.6mm] bg-white text-slate-900 shadow-2xl rounded-sm p-12 md:p-16 space-y-6 text-xs leading-relaxed print:p-8 print:shadow-none">
        {/* Background Letterhead PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/documents/thennakoon-tours-letterhead.png" alt="Letterhead" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 z-0" />

        {isV1 ? (
          <V1UserAgreementContent agreement={agreement} customer={customer} vehicle={vehicle} />
        ) : (
          <LegacyUserAgreementContent agreement={agreement} booking={booking} customer={customer} vehicle={vehicle} companySettings={companySettings} />
        )}
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
      .replace(/{{AGREEMENT_LOCATION}}/g, variables.agreement_location || 'Nugegoda, Sri Lanka')
      .replace(/{{LESSEE_FULL_NAME}}/g, lessee.full_name || 'Lessee')
      .replace(/{{LESSEE_IDENTIFIER_TYPE}}/g, lessee.identifier_type || 'NIC')
      .replace(/{{LESSEE_IDENTIFIER_NO}}/g, lessee.identifier_no || lessee.nic || lessee.passport_number || 'N/A')
      .replace(/{{LESSEE_ADDRESS}}/g, lessee.address || 'Sri Lanka')
      .replace(/{{LESSEE_MOBILE}}/g, lessee.mobile || 'N/A')
      .replace(/{{LESSEE_EMAIL}}/g, lessee.email || 'N/A')
      .replace(/{{ALLOWED_KM_PER_DAY}}/g, String(rental.allowed_km_per_day || variables.allowed_km_per_day || 100))
      .replace(/{{EXTRA_KM_RATE}}/g, String(rental.extra_km_rate || 75))
      .replace(/{{SECURITY_DEPOSIT}}/g, formatNumberSafe(rental.security_deposit || 50000))
      .replace(/{{SECURITY_DEPOSIT_HOLD_DAYS}}/g, String(variables.security_deposit_hold_days || 14))
      .replace(/{{COMPANY_BANK_DETAILS}}/g, variables.company_bank_details || 'Nations Trust Bank - Nugegoda Branch, Account # 100530013140, Swift Code: NTBCLKLX, Thennakoon Tours (Pvt) Ltd')
      .replace(/{{INSURANCE_EXCESS}}/g, formatNumberSafe(variables.insurance_excess || 15000))
      .replace(/{{MINOR_ACCIDENT_THRESHOLD}}/g, formatNumberSafe(variables.minor_accident_threshold || 25000))
      .replace(/{{THIRD_PARTY_INSURANCE_COVER}}/g, formatNumberSafe(variables.third_party_insurance_cover || 500000))
      .replace(/{{ADDITIONAL_DRIVER_FEE}}/g, formatNumberSafe(variables.additional_driver_fee || 5000))
      .replace(/{{MINOR_REPAIR_LIMIT}}/g, formatNumberSafe(variables.minor_repair_limit || 13500))
      .replace(/{{CLEANING_FEE}}/g, formatNumberSafe(variables.cleaning_fee || 1500))
      .replace(/{{FULL_INTERIOR_CLEANING_FEE}}/g, formatNumberSafe(variables.full_interior_cleaning_fee || 12000))
  }

  return (
    <div className="relative z-10 space-y-6 pt-24">
      <div className="text-center border-b border-slate-300 pb-3">
        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">VEHICLE RENTAL AGREEMENT</h1>
        <p className="text-[11px] font-mono text-slate-600 mt-1">Agreement No: <span className="font-bold text-slate-950">{agreement.agreement_number}</span> | Paper Size: <span className="font-bold text-amber-700">US Legal (8.5 × 14 in)</span></p>
      </div>
      <div className="p-4 bg-slate-50/80 rounded border border-slate-200 whitespace-pre-wrap text-[11px]">{replaceTokens(USER_AGREEMENT_PREAMBLE)}</div>
      <div className="space-y-4">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">TERMS AND CONDITIONS OF HIRE</h2>
        {USER_AGREEMENT_CLAUSES.map((clause) => (
          <div key={clause.number} className="space-y-1 text-[11px]">
            <h3 className="font-bold text-slate-900">{clause.number}. {clause.title}</h3>
            <div className="whitespace-pre-wrap text-slate-800 pl-3 border-l-2 border-slate-200">{replaceTokens(clause.content)}</div>
          </div>
        ))}
      </div>
      <div className="pt-6 space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">SCHEDULE TO AGREEMENT</h2>
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-[11px]">
          <div><span className="font-bold text-slate-500 block">Vehicle Name / Make:</span><span className="font-bold">{veh.make_model || veh.vehicle_name || 'Toyota Axio'}</span></div>
          <div><span className="font-bold text-slate-500 block">Registration Number:</span><span className="font-mono font-bold text-amber-700">{veh.registration_number || 'N/A'}</span></div>
          <div><span className="font-bold text-slate-500 block">Rental Start Date:</span><span>{formatDateSafe(agreement.rental_start_at)}</span></div>
          <div><span className="font-bold text-slate-500 block">Rental End Date:</span><span>{formatDateSafe(agreement.rental_end_at)}</span></div>
          <div><span className="font-bold text-slate-500 block">Daily Rental Tariff:</span><span className="font-mono">LKR {formatNumberSafe(rental.daily_rental_rate || 7500)}</span></div>
          <div><span className="font-bold text-slate-500 block">Security Deposit:</span><span className="font-mono">LKR {formatNumberSafe(rental.security_deposit || 50000)}</span></div>
        </div>
      </div>
      <div className="pt-4 space-y-2">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">NOMINATED DRIVER DETAILS</h2>
        <table className="w-full text-left text-[11px] border border-slate-200">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-200">
              <th className="p-2">Driver Name</th>
              <th className="p-2">Driving License No</th>
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
      <div className="pt-4 space-y-2">
        <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] font-mono text-amber-900">{replaceTokens(USER_AGREEMENT_DECLARATION)}</div>
      </div>
      <div className="pt-12 grid grid-cols-2 gap-12 text-[11px]">
        <div className="border-t border-slate-400 pt-2 text-center space-y-1"><p className="font-bold text-slate-900">LESSEE SIGNATURE</p><p className="text-slate-600">{lessee.full_name}</p><p className="font-mono text-slate-400">Date: {formatDateSafe(agreement.agreement_date)}</p></div>
        <div className="border-t border-slate-400 pt-2 text-center space-y-1"><p className="font-bold text-slate-900">FOR LESSOR (THENNAKOON TOURS)</p><p className="text-slate-600">{lessorRep.name || 'Authorized Officer'}</p><p className="font-mono text-slate-400">Date: {formatDateSafe(agreement.agreement_date)}</p></div>
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
    <div className="relative z-10 space-y-6 pt-24">
      <div className="text-center border-b border-slate-300 pb-3">
        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">VEHICLE RENTAL AGREEMENT</h1>
        <p className="text-[11px] font-mono text-slate-600 mt-1">Agreement No: <span className="font-bold text-slate-950">{agreement.agreement_number}</span> | Paper Size: <span className="font-bold text-amber-700">US Legal (8.5 × 14 in)</span></p>
      </div>

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

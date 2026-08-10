import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  USER_AGREEMENT_PREAMBLE,
  USER_AGREEMENT_CLAUSES,
  USER_AGREEMENT_DECLARATION,
} from '@/lib/agreements/templates/user-agreement-v1'

export const metadata = {
  title: 'User Agreement PDF Preview — Thennakoon Tours',
}

export default async function UserAgreementPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agreement } = await supabase
    .from('rental_agreements')
    .select('*, booking:bookings(*), customer:customers(*)')
    .eq('id', id)
    .single()

  if (!agreement) {
    notFound()
  }

  const lessee = agreement.lessee_snapshot || agreement.customer || {}
  const vehicle = agreement.vehicle_snapshot || {}
  const rental = agreement.rental_snapshot || {}
  const variables = agreement.agreement_variables_snapshot || {}
  const drivers = agreement.nominated_drivers_snapshot || []
  const witnesses = agreement.witnesses_snapshot || {}
  const lessorRep = agreement.lessor_representative_snapshot || {}

  // Function to replace tokens in preamble/clauses
  const replaceTokens = (str: string) => {
    if (!str) return ''
    return str
      .replace(/{{AGREEMENT_NUMBER}}/g, agreement.agreement_number || 'N/A')
      .replace(/{{AGREEMENT_DATE}}/g, agreement.agreement_date || new Date().toISOString().slice(0, 10))
      .replace(/{{AGREEMENT_LOCATION}}/g, variables.agreement_location || 'Nugegoda, Sri Lanka')
      .replace(/{{LESSEE_FULL_NAME}}/g, lessee.full_name || 'Lessee')
      .replace(/{{LESSEE_IDENTIFIER_TYPE}}/g, lessee.identifier_type || 'NIC')
      .replace(/{{LESSEE_IDENTIFIER_NO}}/g, lessee.identifier_no || lessee.nic || lessee.passport_number || 'N/A')
      .replace(/{{LESSEE_ADDRESS}}/g, lessee.address || 'Sri Lanka')
      .replace(/{{LESSEE_MOBILE}}/g, lessee.mobile || 'N/A')
      .replace(/{{LESSEE_EMAIL}}/g, lessee.email || 'N/A')
      .replace(/{{EXTRA_KM_RATE}}/g, String(rental.extra_km_rate || 75))
      .replace(/{{SECURITY_DEPOSIT}}/g, Number(rental.security_deposit || 50000).toLocaleString())
      .replace(/{{SECURITY_DEPOSIT_HOLD_DAYS}}/g, String(variables.security_deposit_hold_days || 14))
      .replace(/{{COMPANY_BANK_DETAILS}}/g, variables.company_bank_details || 'Nations Trust Bank - Nugegoda Branch, Account # 100530013140')
      .replace(/{{INSURANCE_EXCESS}}/g, Number(variables.insurance_excess || 25000).toLocaleString())
      .replace(/{{MINOR_REPAIR_LIMIT}}/g, Number(variables.minor_repair_limit || 5000).toLocaleString())
      .replace(/{{FULL_INTERIOR_CLEANING_FEE}}/g, Number(variables.full_interior_cleaning_fee || 7500).toLocaleString())
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      {/* Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/dashboard/agreements"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
        >
          ← Back to Agreements Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          <button
            onClick={() => {}}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-xs"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* A4 Document Paper Container */}
      <div className="relative w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-12 md:p-16 space-y-6 text-xs leading-relaxed print:p-8 print:shadow-none">
        {/* Background Letterhead PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/documents/thennakoon-tours-letterhead.png"
          alt="Thennakoon Tours Letterhead"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 z-0"
        />

        <div className="relative z-10 space-y-6 pt-24">
          {/* Header Title */}
          <div className="text-center border-b border-slate-300 pb-3">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              VEHICLE RENTAL AGREEMENT
            </h1>
            <p className="text-[11px] font-mono text-slate-600 mt-1">
              Agreement No: <span className="font-bold text-slate-950">{agreement.agreement_number}</span> | Version: <span className="font-bold text-amber-700">{agreement.template_version || 'USER_AGREEMENT_V1'}</span>
            </p>
          </div>

          {/* Preamble */}
          <div className="p-4 bg-slate-50/80 rounded border border-slate-200 whitespace-pre-wrap text-[11px]">
            {replaceTokens(USER_AGREEMENT_PREAMBLE)}
          </div>

          {/* Locked 18 Legal Clauses */}
          <div className="space-y-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              TERMS AND CONDITIONS OF HIRE
            </h2>

            {USER_AGREEMENT_CLAUSES.map((clause) => (
              <div key={clause.number} className="space-y-1 text-[11px]">
                <h3 className="font-bold text-slate-900">
                  {clause.number}. {clause.title}
                </h3>
                <div className="whitespace-pre-wrap text-slate-800 leading-normal pl-3 border-l-2 border-slate-200">
                  {replaceTokens(clause.content)}
                </div>
              </div>
            ))}
          </div>

          {/* SCHEDULE TO AGREEMENT */}
          <div className="pt-6 space-y-3">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              SCHEDULE TO AGREEMENT
            </h2>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-[11px]">
              <div>
                <span className="font-bold text-slate-500 block">Vehicle Name / Make:</span>
                <span className="font-bold">{vehicle.make_model || 'Toyota Axio'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Registration Number:</span>
                <span className="font-mono font-bold text-amber-700">{vehicle.registration_number || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Rental Start Date:</span>
                <span>{agreement.rental_start_at ? new Date(agreement.rental_start_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Rental End Date:</span>
                <span>{agreement.rental_end_at ? new Date(agreement.rental_end_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Daily Rental Tariff:</span>
                <span className="font-mono">LKR {Number(rental.daily_rental_rate || 7500).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block">Security Deposit:</span>
                <span className="font-mono">LKR {Number(rental.security_deposit || 50000).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* NOMINATED DRIVER DETAILS */}
          <div className="pt-4 space-y-2">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              NOMINATED DRIVER DETAILS
            </h2>

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
                  <tr>
                    <td colSpan={3} className="p-2 text-slate-400 italic">Self Drive by Lessee.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DECLARATION */}
          <div className="pt-4 space-y-2">
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] font-mono text-amber-900">
              {replaceTokens(USER_AGREEMENT_DECLARATION)}
            </div>
          </div>

          {/* SIGNATURE SECTIONS */}
          <div className="pt-12 grid grid-cols-2 gap-12 text-[11px]">
            <div className="border-t border-slate-400 pt-2 text-center space-y-1">
              <p className="font-bold text-slate-900">LESSEE SIGNATURE</p>
              <p className="text-slate-600">{lessee.full_name}</p>
              <p className="font-mono text-slate-400">Date: {agreement.agreement_date}</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center space-y-1">
              <p className="font-bold text-slate-900">FOR LESSOR (THENNAKOON TOURS)</p>
              <p className="text-slate-600">{lessorRep.name || 'Authorized Officer'}</p>
              <p className="font-mono text-slate-400">Date: {agreement.agreement_date}</p>
            </div>
          </div>

          {/* WITNESSES */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-600">
            <div className="border-t border-slate-300 pt-2 space-y-1">
              <p className="font-bold text-slate-800">WITNESS 1</p>
              <p>Name: {witnesses.witness_1?.name || '__________________________'}</p>
              <p>Address: {witnesses.witness_1?.address || '__________________________'}</p>
            </div>
            <div className="border-t border-slate-300 pt-2 space-y-1">
              <p className="font-bold text-slate-800">WITNESS 2</p>
              <p>Name: {witnesses.witness_2?.name || '__________________________'}</p>
              <p>Address: {witnesses.witness_2?.address || '__________________________'}</p>
            </div>
          </div>

          {/* FINAL SIGNING STATEMENT */}
          <div className="pt-4 text-center text-[10px] text-slate-400 border-t border-slate-200">
            Signed at {variables.agreement_location || 'Nugegoda, Sri Lanka'} on this {agreement.agreement_date}.
          </div>
        </div>
      </div>
    </div>
  )
}

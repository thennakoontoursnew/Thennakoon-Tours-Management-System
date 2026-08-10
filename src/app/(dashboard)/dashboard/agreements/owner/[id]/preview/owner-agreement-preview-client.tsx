'use client'

import Link from 'next/link'

interface OwnerAgreementPreviewClientProps {
  agreement: any
  owner?: any
  vehicles?: any[]
}

export function OwnerAgreementPreviewClient({
  agreement,
  owner,
  vehicles = [],
}: OwnerAgreementPreviewClientProps) {
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

      {/* Print Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/dashboard/agreements"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
        >
          ← Back to Agreements Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            US LEGAL (8.5 × 14 in)
          </span>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* US LEGAL Paper Container: 215.9mm x 355.6mm */}
      <div className="relative w-full max-w-[215.9mm] min-h-[355.6mm] bg-white text-slate-900 shadow-2xl rounded-sm p-12 md:p-16 space-y-6 text-xs print:p-8">
        {/* Background Letterhead PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/documents/thennakoon-tours-letterhead.png"
          alt="Thennakoon Tours Letterhead"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 z-0"
        />

        <div className="relative z-10 space-y-6 pt-24">
          {/* Document Header Title */}
          <div className="text-center border-b border-slate-300 pb-4">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              VEHICLE OWNER PARTNERSHIP AGREEMENT
            </h1>
            <p className="text-[11px] font-mono text-slate-600 mt-1">
              Agreement Reference: <span className="font-bold text-slate-950">{agreement.agreement_number}</span> | Paper Size: <span className="font-bold text-amber-700">US Legal (8.5 × 14 in)</span>
            </p>
          </div>

          {/* Party Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold uppercase text-[10px] text-slate-500 block mb-1">FIRST PARTY (COMPANY)</span>
              <div className="font-bold text-slate-900">THENNAKOON TOURS (PVT) LTD</div>
              <div className="text-[11px] text-slate-600">39 A, 1st Cross Street, Pagoda Road, Nugegoda</div>
              <div className="text-[11px] text-slate-600">Phone: +94 112 823 723 | info@thennakoontours.lk</div>
            </div>
            <div>
              <span className="font-bold uppercase text-[10px] text-slate-500 block mb-1">SECOND PARTY (VEHICLE OWNER)</span>
              <div className="font-bold text-slate-900">{owner?.full_name || 'Vehicle Owner'}</div>
              <div className="text-[11px] text-slate-600">Ref: {owner?.owner_number}</div>
              <div className="text-[11px] text-slate-600">Mobile: {owner?.mobile}</div>
              <div className="text-[11px] text-slate-600">{owner?.address || owner?.email || ''}</div>
            </div>
          </div>

          {/* Agreement Terms Summary */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">1. AGREEMENT PERIOD & SETTLEMENT RULE</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-bold block">Start Date:</span>
                <span className="font-mono">{agreement.agreement_start_date}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">End Date:</span>
                <span className="font-mono">{agreement.agreement_end_date || 'Open-ended / Perpetual'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Settlement Rule:</span>
                <span className="font-mono uppercase font-bold text-amber-700">{agreement.settlement_rule}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Financial Terms:</span>
                <span className="font-semibold">
                  {agreement.settlement_rule === 'percentage' && `${agreement.revenue_share_pct || 70}% Owner Share`}
                  {agreement.settlement_rule === 'fixed_daily' && `LKR ${(agreement.flat_rate_per_day || 0).toLocaleString()} per day`}
                  {agreement.settlement_rule === 'fixed_monthly' && `LKR ${(agreement.fixed_monthly_amount || 0).toLocaleString()} per month`}
                </span>
              </div>
            </div>
          </div>

          {/* Covered Vehicles */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">2. COVERED VEHICLES</h2>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-200">
                  <th className="p-2">Registration No</th>
                  <th className="p-2">Vehicle Name</th>
                  <th className="p-2">Agreed Terms</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length > 0 ? (
                  vehicles.map((v: any) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="p-2 font-mono font-bold">{v.vehicle?.registration_number}</td>
                      <td className="p-2">{v.vehicle?.vehicle_name}</td>
                      <td className="p-2">{agreement.settlement_rule}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-slate-400">All registered partner vehicles under owner roster.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-2 pt-4">
            <h2 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">3. TERMS & CONDITIONS</h2>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {agreement.terms_and_conditions || 'Standard Thennakoon Tours Owner Partnership Terms Apply.'}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-16 grid grid-cols-2 gap-12">
            <div className="border-t border-slate-400 pt-2 text-center space-y-1">
              <p className="font-bold text-slate-900">For Thennakoon Tours (Pvt) Ltd</p>
              <p className="text-[10px] text-slate-500">Authorized Signature & Seal</p>
              <p className="text-[10px] font-mono text-slate-400">Date: {new Date().toISOString().slice(0, 10)}</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center space-y-1">
              <p className="font-bold text-slate-900">{owner?.full_name || 'Vehicle Owner'}</p>
              <p className="text-[10px] text-slate-500">Owner Signature</p>
              <p className="text-[10px] font-mono text-slate-400">Date: {agreement.agreement_start_date}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getOwnerAgreementById } from '@/lib/agreements/agreement-service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, Printer, ArrowLeft, Car, ShieldCheck, DollarSign, Calendar, UserCheck } from 'lucide-react'

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
              <span className="font-mono font-black text-blue-500 text-lg">{agreement.agreement_number}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${agreement.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200' : 'bg-amber-500/10 text-amber-600 border border-amber-200'}`}>
                {agreement.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Owner Agreement — {owner?.full_name || 'Vehicle Owner'}
            </h1>
          </div>
        </div>

        <Link
          href={`/dashboard/agreements/owner/${id}/preview`}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1.5 shrink-0 w-fit"
        >
          <Printer size={15} />
          <span>Print / PDF Owner Agreement</span>
        </Link>
      </div>

      {/* Grid: Agreement Core Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Owner Info Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Vehicle Owner</span>
          <div className="font-bold text-slate-900 dark:text-white text-sm">{owner?.full_name || 'N/A'}</div>
          <div className="text-xs text-slate-500">{owner?.owner_number} • {owner?.mobile}</div>
          <div className="text-xs text-slate-500">{owner?.email || owner?.company_name || 'Individual Owner'}</div>
        </div>

        {/* Settlement Rule Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Settlement Rule Snapshot</span>
          <div className="font-mono font-bold text-amber-500 uppercase text-sm">{agreement.settlement_rule}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
            {agreement.settlement_rule === 'percentage' && `Revenue Share: ${agreement.revenue_share_pct || 70}% Owner`}
            {agreement.settlement_rule === 'fixed_daily' && `Flat Rate: LKR ${(agreement.flat_rate_per_day || 0).toLocaleString()} / Day`}
            {agreement.settlement_rule === 'fixed_monthly' && `Fixed Monthly: LKR ${(agreement.fixed_monthly_amount || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Validity Period Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Agreement Period</span>
          <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            {agreement.agreement_start_date} → {agreement.agreement_end_date || 'Open-ended'}
          </div>
          <div className="text-[11px] text-slate-400">Notice Period: {agreement.termination_notice_days || 30} Days</div>
        </div>
      </div>

      {/* Covered Vehicles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Car size={16} className="text-amber-500" /> Covered Vehicles under Agreement ({vehicles.length})
        </h2>

        {vehicles.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No specific vehicles linked. All partner fleet vehicles covered.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vehicles.map((item: any) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{item.vehicle?.vehicle_name}</div>
                  <div className="font-mono text-[10px] text-slate-400">{item.vehicle?.registration_number}</div>
                </div>
                <Link
                  href={`/dashboard/vehicles/${item.vehicle?.id}`}
                  className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]"
                >
                  View Vehicle
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responsibilities & Terms */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3">Operational Responsibilities & Terms</h2>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Maintenance</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase">{agreement.maintenance_responsibility}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Insurance</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase">{agreement.insurance_responsibility}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Repairs</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase">{agreement.repair_responsibility}</span>
          </div>
        </div>

        {agreement.terms_and_conditions && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Terms & Conditions</span>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
              {agreement.terms_and_conditions}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

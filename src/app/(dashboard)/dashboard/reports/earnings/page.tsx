import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DollarSign, Calendar, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'

export const metadata = {
  title: 'Earnings & Revenue Breakdown — Thennakoon Tours',
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function EarningsPage({ searchParams }: PageProps) {
  const { period = 'this_month' } = await searchParams
  const supabase = await createClient()

  // Fetch Finance Summary KPIs for selected period
  const kpis = await getFinanceSummaryKPIs(supabase, period)

  // Fetch vehicle revenue attribution
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number, daily_rate')
    .eq('is_archived', false)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Earnings & Cash Flow Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Authoritative revenue performance, operating expenses, and net cash flow reports.</p>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'ytd', label: 'Year to Date' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/reports/earnings?period=${p.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.id ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-500">Collected Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-slate-900 dark:text-white text-2xl">
            LKR {kpis.totalCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Actual Completed Incoming Payments</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Invoiced</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-slate-900 dark:text-white text-2xl">
            LKR {kpis.totalInvoiced.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Billed Non-Cancelled Invoices</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-500">Operating Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-rose-500 text-2xl">
            LKR {kpis.totalExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Fuel, Service, Repairs & Admin Costs</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-500">Net Cash Flow</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-amber-500 text-2xl">
            LKR {kpis.netCashFlow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Collected Payments - Approved Expenses</span>
        </div>
      </div>

      {/* Fleet Roster Contribution Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
          Fleet Vehicles Financial Roster Overview
        </h2>
        {vehicles && vehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3">Vehicle Code</th>
                  <th className="py-2.5 px-3">Vehicle Name</th>
                  <th className="py-2.5 px-3">Registration</th>
                  <th className="py-2.5 px-3">Daily Rate</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-500">{v.vehicle_code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{v.vehicle_name}</td>
                    <td className="py-2.5 px-3 font-mono">{v.registration_number}</td>
                    <td className="py-2.5 px-3 font-mono">LKR {Number(v.daily_rate).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link href={`/dashboard/vehicles/${v.id}`} className="text-amber-500 hover:underline font-bold text-[11px]">
                        Vehicle Financials &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 italic">No vehicles registered in fleet roster.</div>
        )}
      </div>
    </div>
  )
}

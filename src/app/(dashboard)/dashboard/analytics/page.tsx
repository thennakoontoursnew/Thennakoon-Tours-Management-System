import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BarChart3, TrendingUp, DollarSign, Users, Car, Wrench, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'
import { getInspectionCenterSummary, getMaintenanceCenterSummary } from '@/lib/maintenance/maintenance-service'
import { getDriverSummaryKPIs } from '@/lib/drivers/driver-service'

export const metadata = {
  title: 'Business Analytics Workspace — Thennakoon Tours',
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { period = 'this_month' } = await searchParams
  const supabase = await createClient()

  const [finance, maintenance, inspection, driver] = await Promise.all([
    getFinanceSummaryKPIs(supabase, period),
    getMaintenanceCenterSummary(supabase),
    getInspectionCenterSummary(supabase),
    getDriverSummaryKPIs(supabase),
  ])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Business Analytics Workspace</h1>
          <p className="text-slate-500 text-xs mt-1">Visual business trends, revenue performance, fleet operations, and driver utilization.</p>
        </div>

        {/* Period Selector */}
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
              href={`/dashboard/analytics?period=${p.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.id ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-500">Collected Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-slate-900 dark:text-white text-2xl">
            LKR {finance.totalCollected.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Actual Completed Incoming Payments</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Billed Invoiced</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-slate-900 dark:text-white text-2xl">
            LKR {finance.totalInvoiced.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Non-Cancelled Invoices Billed</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-500">Operating Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-rose-500 text-2xl">
            LKR {finance.totalExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Fuel, Repairs, Admin & Service Costs</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-500">Net Cash Flow</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="font-mono font-black text-amber-500 text-2xl">
            LKR {finance.netCashFlow.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Collected Revenue - Approved Expenses</span>
        </div>
      </div>

      {/* Operational Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Driver Roster Operations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Driver Roster Status
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-slate-600 dark:text-slate-300">Total Registered Drivers</span>
              <span className="font-mono text-slate-900 dark:text-white">{driver.totalDrivers}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-emerald-500">Available Drivers</span>
              <span className="font-mono text-emerald-500">{driver.available}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-blue-500">Currently Assigned / On Trip</span>
              <span className="font-mono text-blue-500">{driver.assigned + driver.onTrip}</span>
            </div>
          </div>
        </div>

        {/* Maintenance Analytics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Fleet Maintenance Operations
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-slate-600 dark:text-slate-300">Scheduled Tasks</span>
              <span className="font-mono text-slate-900 dark:text-white">{maintenance.scheduled}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-rose-500">Overdue Service Tasks</span>
              <span className="font-mono text-rose-500">{maintenance.overdue}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-purple-500">Monthly Maintenance Cost</span>
              <span className="font-mono text-purple-500">LKR {maintenance.totalCostThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Inspection Analytics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            Vehicle Health & Inspections
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-emerald-500">Passed Inspections</span>
              <span className="font-mono text-emerald-500">{inspection.passed}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-amber-500">Attention Required</span>
              <span className="font-mono text-amber-500">{inspection.attentionRequired}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl font-bold">
              <span className="text-rose-500">Damage Records Logged</span>
              <span className="font-mono text-rose-500">{inspection.damageFound}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

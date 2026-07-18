import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Car, UserSquare2, FileSpreadsheet, Calendar, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Real Database Aggregate Queries
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { count: driverCount } = await supabase
    .from('drivers')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { count: quotationCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')

  const totalRevenue = (payments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Executive Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time sales, bookings, fleet status, and revenue analytics.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={18} /></div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            LKR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <ArrowUpRight size={13} />
            <span>Completed Payments</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bookings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Calendar size={18} /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{bookingCount || 0}</div>
          <Link href="/dashboard/bookings" className="text-[11px] text-amber-500 font-semibold hover:underline flex items-center gap-1">
            <span>Manage Bookings</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quotations</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><FileSpreadsheet size={18} /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{quotationCount || 0}</div>
          <Link href="/dashboard/quotations" className="text-[11px] text-blue-500 font-semibold hover:underline flex items-center gap-1">
            <span>View Quotations</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Users size={18} /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{customerCount || 0}</div>
          <Link href="/dashboard/customers" className="text-[11px] text-indigo-500 font-semibold hover:underline flex items-center gap-1">
            <span>Customer Directory</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Vehicles</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Car size={18} /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{vehicleCount || 0}</div>
          <Link href="/dashboard/vehicles" className="text-[11px] text-purple-500 font-semibold hover:underline flex items-center gap-1">
            <span>Fleet Management</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drivers</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500"><UserSquare2 size={18} /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{driverCount || 0}</div>
          <Link href="/dashboard/drivers" className="text-[11px] text-cyan-500 font-semibold hover:underline flex items-center gap-1">
            <span>Driver Roster</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}

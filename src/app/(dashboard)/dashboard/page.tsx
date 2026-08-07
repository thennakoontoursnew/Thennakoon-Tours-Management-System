import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users,
  Car,
  UserRound,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Plus,
  CalendarCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id || '')
    .maybeSingle()

  const fullName = profile?.full_name || 'Team Member'
  const firstName = fullName.split(' ')[0]

  // Time in Asia/Colombo
  const colomboHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Colombo',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )
  const greeting = getGreeting(colomboHour)

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

  const { count: activeBookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('status', ['confirmed', 'in_progress', 'on_trip'])
    .eq('is_archived', false)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')

  const totalRevenue = (payments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)

  // Recent Bookings Query
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('id, booking_number, status, grand_total, created_at, customer:customers(full_name)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Executive Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock size={13} />
            <span>Sri Lanka Standard Time (Asia/Colombo)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, {firstName}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational overview of Thennakoon Tours Management System.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/quotations/new"
            className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus size={15} />
            <span>New Quotation</span>
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus size={15} />
            <span>New Booking</span>
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Plus size={15} />
            <span>New Customer</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            LKR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <ArrowUpRight size={13} />
            <span>Completed Payments</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{bookingCount || 0}</div>
          <Link href="/dashboard/bookings" className="text-[11px] text-amber-500 font-semibold hover:underline flex items-center gap-1">
            <span>Manage Bookings</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Trips</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{activeBookingCount || 0}</div>
          <div className="text-[11px] text-blue-500 font-semibold flex items-center gap-1">
            <span>Confirmed / On Trip</span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{customerCount || 0}</div>
          <Link href="/dashboard/customers" className="text-[11px] text-indigo-500 font-semibold hover:underline flex items-center gap-1">
            <span>Customer Directory</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Vehicles</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Car size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{vehicleCount || 0}</div>
          <Link href="/dashboard/vehicles" className="text-[11px] text-purple-500 font-semibold hover:underline flex items-center gap-1">
            <span>Fleet Roster</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Drivers</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <UserRound size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{driverCount || 0}</div>
          <Link href="/dashboard/drivers" className="text-[11px] text-cyan-500 font-semibold hover:underline flex items-center gap-1">
            <span>Driver Directory</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Operational Bookings</h2>
            </div>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
            >
              <span>View All Bookings</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentBookings && recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    <th className="py-3 px-4">Booking No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {recentBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-500">{b.booking_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {b.customer?.full_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        LKR {Number(b.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/bookings/${b.id}`}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-all inline-block"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No operational bookings recorded yet.</div>
          )}
        </div>

        {/* Quick Operations Shortcuts & System Health */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">System Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <Link
                href="/dashboard/quotations/new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 group"
              >
                <span>Create Sales Quotation</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-500" />
              </Link>
              <Link
                href="/dashboard/bookings/new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 group"
              >
                <span>Create Direct Booking</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-500" />
              </Link>
              <Link
                href="/dashboard/invoices"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 group"
              >
                <span>Billing & Invoices</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-500" />
              </Link>
              <Link
                href="/dashboard/document-templates"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-500/5 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 group"
              >
                <span>Document Templates & Bank Info</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

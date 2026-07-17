import { createClient } from '@/lib/supabase/server'
import {
  CalendarDays,
  FileText,
  Car,
  TrendingUp,
  DollarSign,
  Star,
  Clock,
  LayoutDashboard,
  AlertTriangle,
  Play,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user session info
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id)
    .single()

  // Current Date in Asia/Colombo timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'full',
  })
  const formattedDate = formatter.format(new Date())

  // Define Stats Cards
  const stats = [
    {
      title: "Today's Bookings",
      value: '0',
      description: 'Fleet assignments',
      icon: CalendarDays,
      color: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Pending Quotations',
      value: '0',
      description: 'Awaiting client response',
      icon: FileText,
      color: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Available Vehicles',
      value: '0',
      description: 'Active fleet status',
      icon: Car,
      color: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Monthly Revenue',
      value: 'LKR 0.00',
      description: 'Invoiced payments',
      icon: TrendingUp,
      color: 'border-l-4 border-l-emerald-500',
    },
    {
      title: 'Monthly Expenses',
      value: 'LKR 0.00',
      description: 'Fleet & operating costs',
      icon: DollarSign,
      color: 'border-l-4 border-l-rose-500',
    },
    {
      title: 'Reviews Received',
      value: '0',
      description: 'Average rating: N/A',
      icon: Star,
      color: 'border-l-4 border-l-amber-500',
    },
  ]

  const getFriendlyRoleLabel = (roleName: string) => {
    return roleName ? roleName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : ''
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full -translate-y-12 translate-x-12 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Welcome Back</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 text-slate-100">
            {profile?.full_name || 'Administrator'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            Role: <span className="text-amber-400 font-semibold">{getFriendlyRoleLabel(profile?.role || '')}</span> &bull; {formattedDate} (Asia/Colombo)
          </p>
        </div>
      </div>

      {/* Module Deployment Notice banner */}
      <div className="bg-amber-50 dark:bg-slate-900/40 border border-amber-200 dark:border-amber-500/10 rounded-2xl p-4 flex gap-3.5 items-start">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
          <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Project Initialization Notice (Phase 1)</span>
          This is an operational dashboard preview. The core business modules are currently deactivated and will be implemented in subsequent development phases. Real statistics and analytical figures will populate here once active modules are configured.
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-xs border border-slate-200/60 dark:border-slate-800 flex items-center justify-between ${stat.color}`}
            >
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider block">
                  {stat.title}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white block">
                  {stat.value}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block">
                  {stat.description}
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Icon size={24} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Two Column details section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity (Empty state) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Clock size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
              <Clock size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-700 dark:text-slate-350 text-xs font-semibold">No Activity Logs Found</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] max-w-xs leading-normal">
                User interactions and fleet updates will appear here once module workflows are active.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (Placeholders) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <LayoutDashboard size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">System Information</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 0 & 1 Status</p>
                <p className="text-[10px] text-slate-400">Database & RLS active</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                ONLINE
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Document letterhead</p>
                <p className="text-[10px] text-slate-400">Fixed asset available</p>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold rounded-full">
                READY
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Next Phase</p>
                <p className="text-[10px] text-slate-400">Customer & Fleet setup</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full">
                PHASE 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

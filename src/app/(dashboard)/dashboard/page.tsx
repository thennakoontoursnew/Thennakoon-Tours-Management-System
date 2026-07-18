import { createClient } from '@/lib/supabase/server'
import {
  Users,
  Car,
  UserCheck,
  Wrench,
  CalendarDays,
  FileText,
  Clock,
  LayoutDashboard,
  CheckCircle,
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

  // Fetch real counts from Phase 2 tables gracefully
  let totalCustomers = 0
  let activeCustomers = 0
  let totalVehicles = 0
  let availableVehicles = 0
  let maintenanceVehicles = 0
  let totalDrivers = 0
  let availableDrivers = 0

  try {
    const [custRes, activeCustRes, vehRes, availVehRes, maintVehRes, drvRes, availDrvRes] =
      await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_archived', false),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available').eq('is_archived', false),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'maintenance').eq('is_archived', false),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'available').eq('is_archived', false),
      ])

    totalCustomers = custRes.count || 0
    activeCustomers = activeCustRes.count || 0
    totalVehicles = vehRes.count || 0
    availableVehicles = availVehRes.count || 0
    maintenanceVehicles = maintVehRes.count || 0
    totalDrivers = drvRes.count || 0
    availableDrivers = availDrvRes.count || 0
  } catch (err) {
    console.error('Error fetching dashboard counts:', err)
  }

  // Current Date in Asia/Colombo timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'full',
  })
  const formattedDate = formatter.format(new Date())

  // Define Real Phase 2 Stats Cards
  const stats = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      description: `${activeCustomers} active clients`,
      icon: Users,
      color: 'border-l-4 border-l-blue-500',
    },
    {
      title: 'Total Vehicles',
      value: totalVehicles.toString(),
      description: `${availableVehicles} available operational`,
      icon: Car,
      color: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Maintenance Fleet',
      value: maintenanceVehicles.toString(),
      description: 'Under service or repair',
      icon: Wrench,
      color: 'border-l-4 border-l-rose-500',
    },
    {
      title: 'Total Drivers',
      value: totalDrivers.toString(),
      description: `${availableDrivers} ready for assignment`,
      icon: UserCheck,
      color: 'border-l-4 border-l-emerald-500',
    },
    {
      title: 'Active Bookings',
      value: '0',
      description: 'Phase 3 module placeholder',
      icon: CalendarDays,
      color: 'border-l-4 border-l-slate-400',
    },
    {
      title: 'Pending Quotations',
      value: '0',
      description: 'Phase 3 module placeholder',
      icon: FileText,
      color: 'border-l-4 border-l-slate-400',
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

      {/* Phase 2 Operational Status Banner */}
      <div className="bg-emerald-50 dark:bg-slate-900/40 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex gap-3.5 items-start">
        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
          <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Phase 2 Core Master Data Active</span>
          Customer Management, Vehicle Categories, Vehicle Fleet, Driver Profiles, Document Vault, and Real Statistics are online and active. Transactional modules (Bookings, Invoices, Maintenance) will connect in Phase 3.
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

      {/* System Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <Clock size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">System Modules Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Customers Module</span>
              <span className="text-[10px] text-emerald-500 font-bold block">ACTIVE ({totalCustomers} Records)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Fleet Module</span>
              <span className="text-[10px] text-emerald-500 font-bold block">ACTIVE ({totalVehicles} Vehicles)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Driver Module</span>
              <span className="text-[10px] text-emerald-500 font-bold block">ACTIVE ({totalDrivers} Drivers)</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
            <LayoutDashboard size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Master Data Status</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Phase 2 Core Master Data</p>
                <p className="text-[10px] text-slate-400">Database & RLS active</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                ONLINE
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Supabase Storage</p>
                <p className="text-[10px] text-slate-400">Images & Docs Vault</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

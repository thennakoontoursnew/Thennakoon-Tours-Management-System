import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Wrench, Calendar, AlertTriangle, CheckCircle, ShieldAlert, ClipboardCheck } from 'lucide-react'
import { getMaintenanceCenterSummary } from '@/lib/maintenance/maintenance-service'
import { MaintenanceClientWrapper } from './maintenance-client-wrapper'

export const metadata = {
  title: 'Maintenance Center — Thennakoon Tours Management System',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const supabase = await createClient()

  // Fetch Summary KPIs
  const kpis = await getMaintenanceCenterSummary(supabase)

  // Fetch Vehicles list for modal
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number')
    .eq('is_archived', false)

  // Fetch Maintenance Tasks
  let query = supabase
    .from('maintenance_tasks')
    .select('*, vehicle:vehicles(vehicle_name, registration_number)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: tasks } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Maintenance Center</h1>
          <p className="text-slate-500 text-xs mt-1">Vehicle service scheduling, repair tracking, and maintenance cost management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/maintenance/inspections"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ClipboardCheck size={16} className="text-amber-500" />
            <span>Inspection Center</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Scheduled</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{kpis.scheduled}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Due Soon</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.dueSoon}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Overdue</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.overdue}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">In Progress</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.inProgress}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Completed (Month)</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.completedThisMonth}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Total Cost (Month)</span>
          <span className="font-mono font-black text-purple-500 text-lg">LKR {kpis.totalCostThisMonth.toLocaleString()}</span>
        </div>
      </div>

      {/* Maintenance Tasks Client Wrapper */}
      <MaintenanceClientWrapper vehicles={vehicles || []} tasks={tasks || []} />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardCheck, Wrench, Search, Filter } from 'lucide-react'
import { getInspectionCenterSummary } from '@/lib/maintenance/maintenance-service'
import { InspectionsClientWrapper } from './inspections-client-wrapper'

export const metadata = {
  title: 'Inspection Center — Thennakoon Tours',
}

interface PageProps {
  searchParams: Promise<{ type?: string; condition?: string }>
}

export default async function InspectionsPage({ searchParams }: PageProps) {
  const { type, condition } = await searchParams
  const supabase = await createClient()

  // Fetch KPI summary
  const kpis = await getInspectionCenterSummary(supabase)

  // Fetch Vehicles list
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number')
    .eq('is_archived', false)

  // Fetch Inspections list
  let query = supabase
    .from('vehicle_inspections')
    .select('*, vehicle:vehicles(vehicle_name, registration_number)')
    .order('inspection_date', { ascending: false })

  if (type && type !== 'all') query = query.eq('inspection_type', type)
  if (condition && condition !== 'all') query = query.eq('overall_condition', condition)

  const { data: inspections } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vehicle Inspection Center</h1>
          <p className="text-slate-500 text-xs mt-1">Pre-handover, return checks, general health inspections, and damage logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/maintenance"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Wrench size={16} className="text-amber-500" />
            <span>Maintenance Center</span>
          </Link>
        </div>
      </div>

      {/* Inspection KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Today's Inspections</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{kpis.totalToday}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Passed Condition</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.passed}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Attention Required</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.attentionRequired}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Damage Found</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.damageFound}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Pending Drafts</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.pending}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            name="type"
            defaultValue={type || 'all'}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Inspection Types</option>
            <option value="general">General Inspection</option>
            <option value="pre_handover">Pre-Handover Check</option>
            <option value="return">Return Inspection</option>
            <option value="maintenance">Maintenance Inspection</option>
            <option value="damage">Damage Assessment</option>
          </select>

          <select
            name="condition"
            defaultValue={condition || 'all'}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Conditions</option>
            <option value="pass">PASS — Vehicle Ready</option>
            <option value="attention_required">Attention Required</option>
            <option value="damage_found">Damage Found</option>
            <option value="maintenance_required">Maintenance Required</option>
          </select>
        </form>
      </div>

      {/* Inspections Table Client Wrapper */}
      <InspectionsClientWrapper vehicles={vehicles || []} inspections={inspections || []} />
    </div>
  )
}

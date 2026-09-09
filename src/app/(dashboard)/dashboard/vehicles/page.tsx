import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Archive, Car } from 'lucide-react'
import { getFleetSummaryKPIs } from '@/lib/fleet/fleet-service'
import { VehiclesClientTable } from './vehicles-client-table'
import { reconcilePendingOnboardingVehiclesAction } from '../maintenance/maintenance-actions'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    status?: string
    transmission?: string
    fuel?: string
    page?: string
  }>
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const categoryFilter = params.category || 'all'
  const statusFilter = params.status || 'all'
  const transmissionFilter = params.transmission || 'all'
  const fuelFilter = params.fuel || 'all'
  const page = parseInt(params.page || '1', 10)
  const pageSize = 12

  const supabase = await createClient()

  // One-time auto-reconciliation of stuck onboarding vehicles (e.g. CBN 1122)
  try {
    await reconcilePendingOnboardingVehiclesAction()
  } catch (_) {}
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).maybeSingle()

  const canCreate = ['owner', 'manager', 'operations_staff'].includes(profile?.role || '')
  const canArchive = ['owner', 'manager'].includes(profile?.role || '')

  // Fetch Fleet KPI Summary passing supabase client
  const kpis = await getFleetSummaryKPIs(supabase)

  // Fetch Categories for filter dropdown
  const { data: categories } = await supabase.from('vehicle_categories').select('id, name').order('name')

  // Build query
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, vehicle_categories(name), vehicle_images(public_url, is_primary), owner:vehicle_owners(id, full_name, mobile, whatsapp)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fleet Roster & Operational Profiles</h1>
          <p className="text-slate-500 text-xs mt-1">Management visibility across vehicle roster, document health, and service schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/fleet"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Fleet Dashboard
          </Link>
          <Link
            href="/dashboard/vehicles/categories"
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Categories
          </Link>
          {canArchive && (
            <Link
              href="/dashboard/vehicles/archived"
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Archive size={15} />
              <span>Archived</span>
            </Link>
          )}
          {canCreate && (
            <Link
              href="/dashboard/vehicles/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              <span>New Vehicle</span>
            </Link>
          )}
        </div>
      </div>

      {/* Fleet KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Fleet</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{kpis.totalFleet}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Available</span>
          <span className="font-mono font-black text-emerald-500 text-xl">{kpis.available}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Reserved</span>
          <span className="font-mono font-black text-blue-500 text-xl">{kpis.reserved}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">On Trip</span>
          <span className="font-mono font-black text-amber-500 text-xl">{kpis.onTrip}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Maintenance</span>
          <span className="font-mono font-black text-rose-500 text-xl">{kpis.maintenance}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Inactive</span>
          <span className="font-mono font-black text-slate-400 text-xl">{kpis.inactive}</span>
        </div>
      </div>

      {/* Roster Segment Tabs & Interactive Vehicle Table */}
      <VehiclesClientTable
        vehicles={vehicles || []}
        categories={categories || []}
        searchParams={params}
      />
    </div>
  )
}

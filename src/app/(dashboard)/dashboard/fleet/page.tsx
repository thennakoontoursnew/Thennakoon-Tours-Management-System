import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Car, Wrench, AlertTriangle, Calendar, ChevronRight, ShieldAlert, CheckCircle2, Clock, Calculator } from 'lucide-react'
import { getFleetSummaryKPIs, calculateDocumentHealth } from '@/lib/fleet/fleet-service'
import { reconcileMissingVehicleOwnersAction } from '../maintenance/maintenance-actions'

export const metadata = {
  title: 'Fleet Overview — Thennakoon Tours Management System',
}

export default async function FleetOverviewPage() {
  const supabase = await createClient()

  try {
    await reconcileMissingVehicleOwnersAction()
  } catch (_) {}

  const kpis = await getFleetSummaryKPIs(supabase)

  // Fetch vehicles with categories
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, category:vehicle_categories(name)')
    .eq('is_archived', false)

  const vehicleList = vehicles || []

  // Service Due & High Mileage Vehicles
  const maintenanceDueVehicles = vehicleList.filter((v) => {
    const curMile = Number(v.current_mileage || 0)
    const dueMile = Number(v.service_due_mileage || 0)
    return (dueMile > 0 && dueMile - curMile <= 500) || (v.next_service_date && v.next_service_date <= new Date().toISOString().slice(0, 10))
  })

  // Vehicles with Expiring Documents
  const documentExpiringVehicles = vehicleList.filter((v) => {
    const h1 = calculateDocumentHealth(v.insurance_expiry)
    const h2 = calculateDocumentHealth(v.revenue_license_expiry)
    const h3 = calculateDocumentHealth(v.emission_test_expiry)
    return h1.status === 'expired' || h1.status === 'expiring_soon' || h2.status === 'expired' || h2.status === 'expiring_soon' || h3.status === 'expired' || h3.status === 'expiring_soon'
  })

  // Fleet Utilization % Calculation: (On Trip + Reserved) / Total Fleet * 100
  const activeCount = kpis.onTrip + kpis.reserved
  const utilizationRate = kpis.totalFleet > 0 ? Math.round((activeCount / kpis.totalFleet) * 100) : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Executive Fleet Control & Utilization</h1>
          <p className="text-slate-500 text-xs mt-1">Management visibility across fleet utilization, service queues, and document health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vehicles"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Car size={16} />
            <span>Manage Vehicle Roster</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Grid */}
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
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Fleet Utilization</span>
          <span className="font-mono font-black text-purple-500 text-xl">{utilizationRate}%</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Due Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-rose-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Service & Maintenance Due</h2>
            </div>
            <span className="font-mono text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
              {maintenanceDueVehicles.length} Due
            </span>
          </div>

          {maintenanceDueVehicles.length > 0 ? (
            <div className="space-y-2 text-xs">
              {maintenanceDueVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                  <div>
                    <Link href={`/dashboard/vehicles/${v.id}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                      {v.vehicle_name} ({v.registration_number})
                    </Link>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Current: {Number(v.current_mileage || 0).toLocaleString()} KM &bull; Service Target: {Number(v.service_due_mileage || 0).toLocaleString()} KM
                    </div>
                  </div>
                  <Link href={`/dashboard/vehicles/${v.id}`} className="p-1 text-slate-400 hover:text-amber-500">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">All vehicles are up to date on service mileage targets.</div>
          )}
        </div>

        {/* Document Health Expiry Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Legal Compliance & Document Alerts</h2>
            </div>
            <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
              {documentExpiringVehicles.length} Alerts
            </span>
          </div>

          {documentExpiringVehicles.length > 0 ? (
            <div className="space-y-2 text-xs">
              {documentExpiringVehicles.map((v) => {
                const h1 = calculateDocumentHealth(v.insurance_expiry)
                const h2 = calculateDocumentHealth(v.revenue_license_expiry)
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                    <div>
                      <Link href={`/dashboard/vehicles/${v.id}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                        {v.vehicle_name} ({v.registration_number})
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${h1.badgeColor}`}>
                          Insurance: {h1.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${h2.badgeColor}`}>
                          Rev Lic: {h2.label}
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/vehicles/${v.id}`} className="p-1 text-slate-400 hover:text-amber-500">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic">All vehicle insurance and revenue licenses are valid.</div>
          )}
        </div>
      </div>
    </div>
  )
}

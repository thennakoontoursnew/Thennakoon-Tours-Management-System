import { createClient } from '@/lib/supabase/server'
import { FuelTrackingClient } from './fuel-tracking-client'

export const metadata = {
  title: 'Fuel Tracking — Thennakoon Tours',
}

export default async function FuelTrackingPage() {
  const supabase = await createClient()

  // Fetch fuel logs with joins
  const { data: fuelLogsRaw } = await supabase
    .from('fuel_logs')
    .select('*, vehicle:vehicles(vehicle_name, registration_number), driver:drivers(full_name)')
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  const fuelLogs = fuelLogsRaw || []

  // Fetch vehicles for form
  const { data: vehiclesRaw } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number, fuel_type')
    .eq('is_archived', false)
    .order('vehicle_name', { ascending: true })

  // Fetch drivers for form
  const { data: driversRaw } = await supabase
    .from('drivers')
    .select('id, full_name')
    .eq('is_archived', false)
    .order('full_name', { ascending: true })

  // Analytics calculation
  const totalCost = fuelLogs.reduce((s, l) => s + Number(l.total_cost || 0), 0)
  const totalLiters = fuelLogs.reduce((s, l) => s + Number(l.liters || 0), 0)
  const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

  const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const thisMonthLogs = fuelLogs.filter((l) => l.log_date && l.log_date.startsWith(thisMonth))
  const logsThisMonth = thisMonthLogs.length
  const costThisMonth = thisMonthLogs.reduce((s, l) => s + Number(l.total_cost || 0), 0)

  return (
    <div className="px-4 py-6 md:px-8">
      <FuelTrackingClient
        fuelLogs={fuelLogs}
        vehicles={vehiclesRaw || []}
        drivers={driversRaw || []}
        analytics={{ totalCost, totalLiters, avgCostPerLiter, logsThisMonth, costThisMonth }}
      />
    </div>
  )
}

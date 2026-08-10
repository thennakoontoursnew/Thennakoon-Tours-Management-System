import { createClient } from '@/lib/supabase/server'
import { getLiveFleetGPSLocations } from '@/lib/fleet/gps-service'
import { GPSClientWrapper } from './gps-client-wrapper'

export const metadata = {
  title: 'Live GPS Telematics — Thennakoon Tours',
}

export default async function FleetGPSPage() {
  const supabase = await createClient()

  const locations = await getLiveFleetGPSLocations(supabase)

  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number, status')
    .eq('is_archived', false)

  // Fetch geofences
  const { data: geofences } = await supabase
    .from('vehicle_geofences')
    .select('*')

  // Fetch recent trip tracking logs
  const { data: tripLogs } = await supabase
    .from('trip_tracking_logs')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(30)

  return (
    <div className="px-4 py-6 md:px-8">
      <GPSClientWrapper
        locations={locations}
        vehicles={vehicles || []}
        geofences={geofences || []}
        tripLogs={tripLogs || []}
      />
    </div>
  )
}

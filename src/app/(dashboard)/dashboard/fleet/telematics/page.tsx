import { createClient } from '@/lib/supabase/server'
import { getLiveFleetGPSLocations } from '@/lib/fleet/gps-service'
import { GPSClientWrapper } from '../gps/gps-client-wrapper'

export const metadata = {
  title: 'Live Telematics & GPS Fleet Tracking — Thennakoon Tours',
}

export default async function TelematicsPage() {
  const supabase = await createClient()

  const locations = await getLiveFleetGPSLocations(supabase)

  // Fetch vehicles with live telemetry fields
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number, status, tracker_id, current_latitude, current_longitude, current_speed, current_battery, telemetry_status, last_telemetry_at')
    .eq('is_archived', false)

  // Fetch geofences
  const { data: geofences } = await supabase
    .from('vehicle_geofences')
    .select('*')

  // Fetch recent telemetry logs
  const { data: tripLogs } = await supabase
    .from('vehicle_telemetry')
    .select('*')
    .order('created_at', { ascending: false })
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

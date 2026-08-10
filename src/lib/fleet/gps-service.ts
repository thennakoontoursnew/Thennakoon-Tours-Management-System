export interface GPSLocationPoint {
  id: string
  vehicle_id: string
  vehicle_name?: string
  registration_number?: string
  latitude: number
  longitude: number
  speed_kmh: number
  heading: number
  ignition_on: boolean
  battery_level_pct: number
  location_name?: string
  recorded_at: string
}

// Key Sri Lankan GPS Telematics Reference Coordinates
export const fontSriLankaLocations = [
  { name: 'Colombo Central Depot', lat: 6.9271, lng: 79.8612 },
  { name: 'Bandaranaike International Airport (CMB)', lat: 7.1808, lng: 79.8841 },
  { name: 'Kandy Express Corridor', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle Coastal Highway', lat: 6.0535, lng: 80.2210 },
  { name: 'Sigiriya Cultural Hub', lat: 7.9570, lng: 80.7603 },
  { name: 'Ella Mountain Pass', lat: 6.8667, lng: 81.0466 },
]

export async function getLiveFleetGPSLocations(supabase: any): Promise<GPSLocationPoint[]> {
  const [vehiclesRes, gpsRes] = await Promise.all([
    supabase.from('vehicles').select('id, vehicle_name, registration_number, status').eq('is_archived', false),
    supabase.from('vehicle_gps_locations').select('*').order('recorded_at', { ascending: false }),
  ])

  const vehicles = vehiclesRes.data || []
  const gpsLogs = gpsRes.data || []

  // Map latest location per vehicle
  return vehicles.map((v: any, idx: number) => {
    const existingLog = gpsLogs.find((g: any) => g.vehicle_id === v.id)
    const refLoc = fontSriLankaLocations[idx % fontSriLankaLocations.length]

    if (existingLog) {
      return {
        id: existingLog.id,
        vehicle_id: v.id,
        vehicle_name: v.vehicle_name,
        registration_number: v.registration_number,
        latitude: Number(existingLog.latitude),
        longitude: Number(existingLog.longitude),
        speed_kmh: Number(existingLog.speed_kmh || 0),
        heading: Number(existingLog.heading || 0),
        ignition_on: Boolean(existingLog.ignition_on),
        battery_level_pct: Number(existingLog.battery_level_pct || 100),
        location_name: existingLog.location_name || refLoc.name,
        recorded_at: existingLog.recorded_at,
      }
    }

    // Default active telematics snapshot for fleet map visualization
    return {
      id: `sim-${v.id}`,
      vehicle_id: v.id,
      vehicle_name: v.vehicle_name,
      registration_number: v.registration_number,
      latitude: refLoc.lat,
      longitude: refLoc.lng,
      speed_kmh: v.status === 'on_trip' ? 55.0 : 0.0,
      heading: 45.0,
      ignition_on: v.status === 'on_trip',
      battery_level_pct: 98,
      location_name: refLoc.name,
      recorded_at: new Date().toISOString(),
    }
  })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveGeofenceLocation, determineTelemetryStatus } from '@/lib/telemetry/geofence-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[Telemetry Ping Webhook Received]', body)

    // Optional Header / Key Check
    const authHeader = req.headers.get('x-telemetry-key') || req.headers.get('authorization')
    const expectedKey = process.env.TELEMETRY_SECRET_KEY
    if (expectedKey && authHeader !== expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      console.warn('[Telemetry Ping] Unauthorized request token')
      return NextResponse.json({ error: 'Unauthorized telemetry key' }, { status: 401 })
    }

    // Extract Telemetry Fields with flexible fallbacks for OwnTracks & custom mobile payloads
    const trackerId = body.tracker_id || body.tid || body.device_id || body.uniqueId || null
    const vehicleId = body.vehicle_id || null

    const lat = Number(body.lat ?? body.latitude)
    const lon = Number(body.lon ?? body.lng ?? body.longitude)
    const speed = Number(body.speed ?? body.vel ?? body.speed_kmh ?? 0)
    const battery = Number(body.batt ?? body.battery ?? body.battery_level ?? 100)
    const heading = Number(body.heading ?? body.cog ?? 0)

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: latitude and longitude are required numeric values' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Locate Vehicle by tracker_id OR vehicle_id
    let vehicle: any = null

    if (trackerId) {
      const { data: vByTracker } = await supabase
        .from('vehicles')
        .select('id, vehicle_name, registration_number, tracker_id')
        .eq('tracker_id', String(trackerId).trim())
        .maybeSingle()
      vehicle = vByTracker
    }

    if (!vehicle && vehicleId) {
      const { data: vById } = await supabase
        .from('vehicles')
        .select('id, vehicle_name, registration_number, tracker_id')
        .eq('id', vehicleId)
        .maybeSingle()
      vehicle = vById
    }

    // Fallback: If only 1 vehicle exists in system and no tracker_id match, attach to first active vehicle
    if (!vehicle) {
      const { data: firstVehicle } = await supabase
        .from('vehicles')
        .select('id, vehicle_name, registration_number, tracker_id')
        .eq('is_archived', false)
        .limit(1)
        .maybeSingle()
      vehicle = firstVehicle
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found matching provided tracker_id or vehicle_id' },
        { status: 444 }
      )
    }

    const now = new Date().toISOString()
    const locationName = body.location_name || resolveGeofenceLocation(lat, lon)
    const status = determineTelemetryStatus(speed, battery, now)

    // 2. Insert Telemetry Log into vehicle_telemetry table
    const { data: teleLog, error: teleErr } = await supabase
      .from('vehicle_telemetry')
      .insert({
        vehicle_id: vehicle.id,
        tracker_id: trackerId || vehicle.tracker_id,
        latitude: lat,
        longitude: lon,
        speed: speed,
        battery_level: battery,
        heading: heading,
        raw_payload: body,
        location_name: locationName,
        created_at: now,
      })
      .select()
      .single()

    if (teleErr) {
      console.error('[Telemetry Ping] Error inserting vehicle_telemetry log:', teleErr)
    }

    // 3. Insert Legacy Compatibility Log into vehicle_gps_locations table
    await supabase.from('vehicle_gps_locations').insert({
      vehicle_id: vehicle.id,
      latitude: lat,
      longitude: lon,
      speed_kmh: speed,
      heading: heading,
      battery_level_pct: battery,
      location_name: locationName,
      ignition_on: speed > 0,
      recorded_at: now,
    })

    // 4. Update Vehicles Cached Live Location State
    const { error: vehicleUpdateErr } = await supabase
      .from('vehicles')
      .update({
        current_latitude: lat,
        current_longitude: lon,
        current_speed: speed,
        current_battery: battery,
        last_telemetry_at: now,
        telemetry_status: status,
      })
      .eq('id', vehicle.id)

    if (vehicleUpdateErr) {
      console.error('[Telemetry Ping] Error updating vehicle state:', vehicleUpdateErr)
    }

    return NextResponse.json({
      success: true,
      vehicle_id: vehicle.id,
      registration_number: vehicle.registration_number,
      tracker_id: vehicle.tracker_id || trackerId,
      status: status,
      speed_kmh: speed,
      battery_pct: battery,
      location_name: locationName,
      timestamp: now,
      log_id: teleLog?.id,
    })
  } catch (err: any) {
    console.error('[Telemetry Ping] Exception handler:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/telemetry/ping',
    protocol: 'Universal JSON / OwnTracks Telemetry Webhook Endpoint',
    accepted_fields: ['tracker_id', 'lat', 'lon', 'speed', 'batt', 'vehicle_id', 'location_name'],
  })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveGeofenceLocation, determineTelemetryStatus } from '@/lib/telemetry/geofence-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[Traccar Webhook Received]', body)

    // Traccar Webhook sends payload containing device and position objects or array
    const device = body.device || {}
    const position = body.position || body

    const trackerId = device.uniqueId || position.deviceId || body.uniqueId || body.deviceId
    const lat = Number(position.latitude ?? body.latitude)
    const lon = Number(position.longitude ?? body.longitude)
    
    // Traccar speed is in knots by default, convert knots to km/h if needed (1 knot = 1.852 km/h)
    let speed = Number(position.speed ?? body.speed ?? 0)
    if (position.speedInKnots || body.speedInKnots) {
      speed = speed * 1.852
    }

    const battery = Number(position.attributes?.batteryLevel ?? position.attributes?.battery ?? body.battery ?? 100)
    const heading = Number(position.course ?? position.heading ?? body.course ?? 0)

    if (!trackerId || isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Invalid Traccar payload: device.uniqueId, position.latitude and position.longitude are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Locate Vehicle by tracker_id equal to Traccar uniqueId / IMEI
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, vehicle_name, registration_number, tracker_id')
      .eq('tracker_id', String(trackerId).trim())
      .maybeSingle()

    if (!vehicle) {
      console.warn('[Traccar Webhook] No vehicle registered with tracker_id:', trackerId)
      return NextResponse.json(
        { error: `No registered vehicle found matching Traccar tracker_id / IMEI: ${trackerId}` },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const locationName = position.address || resolveGeofenceLocation(lat, lon)
    const status = determineTelemetryStatus(speed, battery, now)

    // 2. Insert Telemetry Log into vehicle_telemetry
    await supabase.from('vehicle_telemetry').insert({
      vehicle_id: vehicle.id,
      tracker_id: String(trackerId).trim(),
      latitude: lat,
      longitude: lon,
      speed: speed,
      battery_level: battery,
      heading: heading,
      raw_payload: body,
      location_name: locationName,
      created_at: now,
    })

    // 3. Insert Legacy Compatibility Log into vehicle_gps_locations
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
    await supabase
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

    return NextResponse.json({
      success: true,
      protocol: 'Traccar / SinoTrack Webhook',
      vehicle_id: vehicle.id,
      tracker_id: trackerId,
      registration_number: vehicle.registration_number,
      status: status,
      speed_kmh: speed,
      battery_pct: battery,
      location_name: locationName,
      timestamp: now,
    })
  } catch (err: any) {
    console.error('[Traccar Webhook] Exception handler:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/telemetry/traccar',
    protocol: 'Traccar / SinoTrack Webhook Forwarder Endpoint',
    accepted_fields: ['device.uniqueId', 'position.latitude', 'position.longitude', 'position.speed'],
  })
}

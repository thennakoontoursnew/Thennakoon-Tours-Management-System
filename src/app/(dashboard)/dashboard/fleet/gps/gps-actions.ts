'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =============================================
// RECORD VEHICLE GPS LOCATION TELEMETRY
// =============================================
export async function recordGPSLocationAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: log, error } = await supabase
    .from('vehicle_gps_locations')
    .insert({
      vehicle_id: data.vehicle_id,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      speed_kmh: Number(data.speed_kmh || 0),
      heading: Number(data.heading || 0),
      ignition_on: data.ignition_on !== undefined ? Boolean(data.ignition_on) : true,
      battery_level_pct: Number(data.battery_level_pct || 100),
      location_name: data.location_name || null,
      recorded_at: data.recorded_at || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/gps')
  return { success: true, log }
}

// =============================================
// RECORD TRIP TRACKING EVENT
// =============================================
export async function recordTripEventAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: event, error } = await supabase
    .from('trip_tracking_logs')
    .insert({
      booking_id: data.booking_id,
      vehicle_id: data.vehicle_id || null,
      driver_id: data.driver_id || null,
      event_type: data.event_type,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      odometer_reading: data.odometer_reading ? Number(data.odometer_reading) : null,
      fuel_level_pct: data.fuel_level_pct ? Number(data.fuel_level_pct) : null,
      photo_url: data.photo_url || null,
      notes: data.notes || null,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/gps')
  revalidatePath('/dashboard/bookings')
  return { success: true, event }
}
